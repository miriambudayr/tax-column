# Thought Log

I almost always write thought logs when I develop.

# Tokenizers

So far I have created a tokenizer function and test. No matter what, I will need a tokenizer.

# Plan

I am going to defer:

- Real-time type-to-search feature
  - The reason I am deferring this is because creating a working full-text search solution is more important than the search interface.
- Using an actual mobile device

First priorities:

- Create basic tokenization ✅
- Process files and tokenize them ✅
- Build a basic inverted index in memory for now (using a smaller dataset) to get a sense of how I could translate this to a disk-based index. ✅

After that is done:

- Storing all of the data in memory isn't an option (makes sense, it doesn't scale). I need to build an index on disk. I could use postgresql or sqlite. Need to consider tradeoffs there but my instinct is to start with sqlite. I can always swap it out for something else later.
