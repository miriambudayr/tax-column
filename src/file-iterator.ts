import { program } from "commander";
import fs from "fs";
import path from "path";
import { listFilesSync } from ".";

/**
 * I used commander to simplify CLI argument handling and ensure the script is extensible for future features.
 */

program.name("file-iterator").argument("<absolutePath>", "Absolute path");

const [absolutePath] = program.parse().args;

if (!absolutePath) {
  console.error("Error: No path provided. Please specify a directory.");
  process.exit(1);
}

console.log(`Listing files from: ${absolutePath}\n`);

(() => {
  console.log("files: ", listFilesSync(absolutePath));
})();
