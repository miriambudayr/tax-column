import { tokenize } from ".";

describe("Tokenization function", () => {
  it("splits text into words", () => {
    expect(tokenize("this is a sentence")).toEqual([
      "this",
      "is",
      "a",
      "sentence",
    ]);
  });

  it("removes punctuation", () => {
    expect(tokenize("hello.")).toEqual(["hello"]);
  });

  it("removes extra spaces", () => {
    expect(tokenize("hello        world  again")).toEqual([
      "hello",
      "world",
      "again",
    ]);
  });
});
