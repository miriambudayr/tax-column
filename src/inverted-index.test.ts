import { DB_PATH, InvertedIndex } from ".";
import dotenv from "dotenv";
import fs from "fs";
import { assert } from "./assert";
dotenv.config();

const TEST_DATA_DIR = "src/test_data";

describe("Database Setup", () => {
  beforeEach(() => {
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });
  it("should create the SQLite database file", () => {
    new InvertedIndex();
    const dbPath = process.env.DB_PATH;
    assert(dbPath, "DB_PATH environment variable not found");
    expect(fs.existsSync(dbPath)).toBe(true);
  });
});

describe("Inverted Index", () => {
  beforeEach(() => {
    if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });
  it("should index and search a file", () => {
    const fileName = `${TEST_DATA_DIR}/lorem-ipsum.txt`;
    const invertedIndex = new InvertedIndex();
    invertedIndex.indexFile(fileName);

    const files = invertedIndex.search("metus");

    expect(files.length).toBeGreaterThan(0);

    if (files) {
      for (const file of files) {
        expect(file).toEqual(fileName);
      }
    }
  });

  it("should search a phrase", () => {
    const fileName = `${TEST_DATA_DIR}/lorem-ipsum.txt`;
    const invertedIndex = new InvertedIndex();
    invertedIndex.indexFile(fileName);

    const files = invertedIndex.searchPhrase("euismod ornare ultrices");

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
    const dirName = TEST_DATA_DIR;
    assert(dirName, "SAMPLE_DATA_DIR environment variable not found");
    const invertedIndex = new InvertedIndex();
    invertedIndex.recursivelyIndexDirectory(dirName);

    let files = invertedIndex.search("porta");
    expect(Array.from(files!)).toMatchSnapshot();

    files = invertedIndex.searchPhrase("porta magna urna et elit");
    expect(Array.from(files!)).toMatchSnapshot();
  });
});
