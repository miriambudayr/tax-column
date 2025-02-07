import { InvertedIndex } from ".";
import dotenv from "dotenv";
import { assert } from "./assert";
dotenv.config();

describe("Inverted Index", () => {
  it("should index a file", () => {
    const fileName = "src/lorem-ipsum.txt";
    const invertedIndex = new InvertedIndex();
    invertedIndex.indexFile(fileName);

    const files = invertedIndex.search("metus");

    expect(files.size).toBeGreaterThan(0);

    if (files) {
      for (const file of files) {
        expect(file).toEqual(fileName);
      }
    }
  });

  it("should tokenize a directory", () => {
    const dirName = process.env.SAMPLE_DATA_DIR;
    assert(dirName, "SAMPLE_DATA_DIR variable not found in environment");
    const invertedIndex = new InvertedIndex();
    invertedIndex.recursivelyIndexDirectory(dirName);

    const files = invertedIndex.search("calendar");
    expect(Array.from(files!)).toMatchSnapshot();
  });
});
