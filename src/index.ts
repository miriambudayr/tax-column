import fs from "fs";
import path from "path";
import DatabaseConstructor, { Database } from "better-sqlite3";

export function listFilesSync(dir: string, files: string[] = []): string[] {
  try {
    if (!fs.existsSync(dir)) {
      console.error(`Error: Directory ${dir} does not exist.`);
      process.exit(1);
    }
    const listing = fs.readdirSync(dir, { withFileTypes: true });
    let dirs = [];
    for (let f of listing) {
      const fullName = path.join(dir, f.name);
      if (f.isFile()) {
        files.push(fullName);
      } else if (f.isDirectory()) {
        dirs.push(fullName);
      }
    }
    for (let d of dirs) {
      listFilesSync(d, files);
    }

    return files;
  } catch (e) {
    console.error(
      `Error: listing files in directory ${dir} failed with error ${e}. Skipping.`
    );
    return files;
  }
}

export function tokenize(text: string): string[] {
  // TODO: not sure if this is enough cleaning after looking at the files more closely.
  const cleanText = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
  return cleanText.split(/\s+/).filter(Boolean);
}

export const DB_PATH = "src/searchIndex.db";

export class TextSearchEngine {
  private db: Database;

  constructor() {
    this.db = new DatabaseConstructor(DB_PATH);
    this.setupSchema();
  }

  setupSchema() {
    // query should search for `token` in `tokens` table, get the id
    // and then find all `token_files` rows that contain the `id`.
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE
      )  
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS token_files (
        token_id INTEGER,
        file_name TEXT,
        position INTEGER,  -- NEW: Stores word position in the file
        PRIMARY KEY (token_id, file_name, position),
        FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
      )
    `);
  }

  tokenizeFile(fileName: string): string[] {
    const content = fs.readFileSync(fileName, "utf-8");
    return tokenize(content);
  }

  indexFile(fileName: string) {
    const tokens = this.tokenizeFile(fileName);

    // if token already exists, ignore it.
    // we expect there to be duplicate tokens.
    const insertTokenStatement = this.db.prepare(
      "INSERT OR IGNORE INTO tokens (token) VALUES (?)"
    );

    const getTokenIdStatement = this.db.prepare(
      "SELECT id FROM tokens WHERE token = ?"
    );

    // using INSERT OR IGNORE INTO here because one file might have multiple copies
    // of the same token.
    // I think I will need to consider text positions later when I want to do
    // multi-token text search? so this will probably become much stricter.
    const insertMappingStatement = this.db.prepare(
      "INSERT OR IGNORE INTO token_files (token_id, file_name, position) VALUES (?, ?, ?)"
    );

    this.db.transaction(() => {
      tokens.forEach((token, position) => {
        insertTokenStatement.run(token);
        const row = getTokenIdStatement.get(token) as { id: number };
        if (row) {
          insertMappingStatement.run(row.id, fileName, position);
        }
      });
    })();
  }

  recursivelyIndexDirectory(dirName: string) {
    const files = listFilesSync(dirName);

    for (const file of files) {
      this.indexFile(file);
    }
  }

  // TODO: this will search for exact, single tokens.
  // Need to be able to search for multiple tokens together.
  search(token: string): string[] {
    const rows = this.db
      .prepare(
        `
      SELECT file_name FROM token_files
      JOIN tokens ON tokens.id = token_files.token_id
      WHERE tokens.token = ?
    `
      )
      .all(token.toLowerCase()) as { file_name: string }[];

    return rows.map((row) => row.file_name);
  }

  searchPhrase(phrase: string): string[] {
    const tokens = tokenize(phrase.toLowerCase());
    if (tokens.length == 0) {
      return [];
    }

    // try to match first token
    let query = `
      SELECT tf1.file_name FROM token_files tf1
      JOIN tokens t1 ON t1.id = tf1.token_id AND t1.token = ?
    `;

    const params: (string | number)[] = [tokens[0]];

    /**
     * Search for tokens that are next to each other.
     * Example: ["fraud investigation money"]
     * If "fraud" token has a position of 0, then "investigation" should have pos=1,
     * and "money" should have pos=1
     * 
     * The SQL would look like:
     * 
          SELECT tf1.file_name FROM token_files tf1
          JOIN tokens t1 ON t1.id = tf1.token_id AND t1.token = 'fraud'

          JOIN token_files tf2 ON tf1.file_name = tf2.file_name
          JOIN tokens t2 ON t2.id = tf2.token_id AND t2.token = 'investigation'
          AND tf2.position = tf1.position + 1

          ... etc

     */
    for (let i = 1; i < tokens.length; i++) {
      query += `
              JOIN token_files tf${i + 1} ON tf${i}.file_name = tf${
        i + 1
      }.file_name
              JOIN tokens t${i + 1} ON t${i + 1}.id = tf${
        i + 1
      }.token_id AND t${i + 1}.token = ?
              AND tf${i + 1}.position = tf${i}.position + 1
            `;
      params.push(tokens[i]);
    }

    const rows = this.db.prepare(query).all(...params) as {
      file_name: string;
    }[];
    return rows.map((row) => row.file_name);
  }

  // TODO: do the same thing but with phrases instead of individual tokens.
  searchPrefix(prefix: string): { file: string; matchedWord: string }[] {
    const rows = this.db
      .prepare(
        `
        SELECT DISTINCT file_name, tokens.token as matchedWord FROM token_files
        JOIN tokens ON tokens.id = token_files.token_id
        WHERE tokens.token LIKE ?
        LIMIT 50  -- Prevent excessive results
      `
      )
      .all(`${prefix.toLowerCase()}%`) as {
      file_name: string;
      matchedWord: string;
      position: number;
    }[];

    // Would be nice to also include position here because as it is now,
    // if there are multiple prefix matches in one file, it will just return that
    // file name multiple times.
    return rows.map((row) => ({
      file: row.file_name,
      matchedWord: row.matchedWord,
    }));
  }
}
