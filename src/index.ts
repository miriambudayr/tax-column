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

type Token = string;
type FileName = string;
interface IndexRow {
  files: string;
  id: number;
}

export const DB_PATH = "src/invertedIndex.db";

export class InvertedIndex {
  private index: Map<Token, Set<FileName>> = new Map();
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
        PRIMARY KEY (token_id, file_name),
        FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE
      )
    `);
  }

  tokenizeFile(fileName: FileName): string[] {
    const content = fs.readFileSync(fileName, "utf-8");
    return tokenize(content);
  }

  indexFile(fileName: FileName) {
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
      "INSERT OR IGNORE INTO token_files (token_id, file_name) VALUES (?, ?)"
    );

    this.db.transaction(() => {
      for (const token of tokens) {
        insertTokenStatement.run(token);
        const row = getTokenIdStatement.get(token) as IndexRow | undefined;

        if (row) {
          insertMappingStatement.run(row.id, fileName);
        }
      }
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
      .all(token) as { file_name: string }[];

    return rows.map((row) => row.file_name);
  }
}
