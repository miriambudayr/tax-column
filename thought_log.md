# Thought Log

I almost always write thought logs when I develop. The log is written chronologically (the newest entries are at the bottom).

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

# Inverted index finished - next step, disk

I finished the basic inverted index. I know ElasticSearch uses inverted indices so it was useful for me to remind myself how these work again. I want to translate my in-memory inverted index to disk. How can I get multi-token search functionality? Probably need to think of how to query the inverted index (intersections?), but first I need an inverted index on disk.

# Postgresql vs sqlite

- Sqlite
  - Minimal setup complexity
  - Good for read-heavy systems (concerned about the write throughput as data scales, though)
  - Lightweight for mobile
  - Has FTS5 but I'm going to stray away from using something like that since we are discouraged from using out-of-the-box solutions.
- Postgresql
  - Setup is more complex
  - More scalable for massive concurrent writes
  - Requires a backend server, needs internet connection which is a constraint in the specs

I am going to use sqlite because it ticks more of the important boxes.
