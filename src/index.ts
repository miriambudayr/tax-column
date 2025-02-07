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

export class InvertedIndex {
  private index: Map<Token, Set<FileName>> = new Map();
  private db: Database;

  constructor(dbPath: string = "src/invertedIndex.db") {
    this.db = new DatabaseConstructor(dbPath);
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

  indexFile(fileName: FileName) {
    const content = fs.readFileSync(fileName, "utf-8");
    const tokens = tokenize(content);

    for (const token of tokens) {
      if (!this.index.has(token)) {
        this.index.set(token, new Set());
      }

      this.index.get(token)!.add(fileName);
    }
  }

  recursivelyIndexDirectory(dirName: string) {
    const files = listFilesSync(dirName);

    for (const file of files) {
      this.indexFile(file);
    }
  }

  // TODO: this will search for exact, single tokens.
  // Need to be able to search for multiple tokens together.
  search(token: string) {
    return this.index.get(token) ?? new Set();
  }
}
