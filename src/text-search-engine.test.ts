import { DB_PATH, TextSearchEngine } from ".";
import dotenv from "dotenv";
import fs from "fs";
import { assert } from "./assert";
dotenv.config();

const TEST_DATA_DIR = "src/test_data";

describe("Text Search Engine", () => {
  describe("Database Setup", () => {
    beforeEach(() => {
      if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
      }
    });

    afterEach(() => {
      if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
      }
    });

    it("should create the SQLite database file", () => {
      new TextSearchEngine();
      const dbPath = DB_PATH;
      expect(fs.existsSync(dbPath)).toBe(true);
    });
  });

  describe("File Indexing and Search", () => {
    beforeEach(() => {
      if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
      }
    });

    afterEach(() => {
      if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
      }
    });

    it("should index and search a file", () => {
      const fileName = `${TEST_DATA_DIR}/lorem-ipsum.txt`;
      const searchEngine = new TextSearchEngine();
      searchEngine.indexFile(fileName);

      const files = searchEngine.search("metus");

      expect(files.length).toBeGreaterThan(0);

      if (files) {
        for (const file of files) {
          expect(file).toEqual(fileName);
        }
      }
    });

    it("should search a phrase", () => {
      const fileName = `${TEST_DATA_DIR}/lorem-ipsum.txt`;
      const searchEngine = new TextSearchEngine();
      searchEngine.indexFile(fileName);

      const files = searchEngine.searchPhrase("euismod ornare ultrices");

      expect(files.length).toBeGreaterThan(0);

      if (files) {
        for (const file of files) {
          expect(file).toEqual(fileName);
        }
      }
    });

    it("should tokenize a directory", () => {
      // TODO: try using actual data sample once this works. The dev feedback loop was way too slow
      // to use the sample data for now.
      // const dirName = process.env.SAMPLE_DATA_DIR;
      // assert(dirName, "SAMPLE_DATA_DIR environment variable not found");

      const dirName = TEST_DATA_DIR;
      const searchEngine = new TextSearchEngine();
      searchEngine.recursivelyIndexDirectory(dirName);

      let files = searchEngine.search("porta");
      expect(Array.from(files!)).toMatchSnapshot();

      files = searchEngine.searchPhrase("porta magna urna et elit");
      expect(Array.from(files!)).toMatchSnapshot();
    });

    it("should recursively tokenize a directory", () => {
      const dirName = TEST_DATA_DIR;
      const searchEngine = new TextSearchEngine();
      searchEngine.recursivelyIndexDirectory(dirName);

      let files = searchEngine.search("simmons");
      expect(Array.from(files!)).toMatchSnapshot();

      files = searchEngine.searchPhrase("dinner hosted by matt simmons");
      expect(Array.from(files!)).toMatchSnapshot();
    });

    it("should use case-insensitive search", () => {
      const dirName = TEST_DATA_DIR;
      const searchEngine = new TextSearchEngine();
      searchEngine.recursivelyIndexDirectory(dirName);

      let files = searchEngine.search("Simmons");
      expect(Array.from(files!)).toMatchSnapshot();

      files = searchEngine.searchPhrase("Dinner hosted by Matt Simmons");
      expect(Array.from(files!)).toMatchSnapshot();
    });
  });

  describe("Prefix Search (Search-as-You-Type)", () => {
    beforeEach(() => {
      if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
      }
    });

    afterEach(() => {
      if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
      }
    });

    it("should return files and words containing a prefix", () => {
      const dirName = TEST_DATA_DIR;
      const searchEngine = new TextSearchEngine();
      searchEngine.recursivelyIndexDirectory(dirName);

      const results = searchEngine.searchPrefix("pres");

      expect(results.length).toBeGreaterThan(0);
      expect(results).toMatchSnapshot();
    });
  });
});
