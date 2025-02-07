export function assert(v: any, why = ""): asserts v {
  if (!v) {
    const error = new Error(`Assertion Failed: ${why}`);
    error.name = "AssertionFailure";

    console.error("AssertionFailure", error);
    throw error;
  }
}
