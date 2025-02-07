import { InvertedIndex } from ".";

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
});
