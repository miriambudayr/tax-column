import { program } from "commander";
import fs from "fs";
import path from "path";

/**
 * I used commander to simplify CLI argument handling and ensure the script is extensible for future features.
 */

program.name("file-iterator").argument("<absolutePath>", "Absolute path");

const [absolutePath] = program.parse().args;

if (!absolutePath) {
  console.error("Error: No path provided. Please specify a directory.");
  process.exit(1);
}

function listFilesSync(dir: string, files: string[] = []): string[] {
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

    console.log("Done listing files");
    return files;
  } catch (e) {
    console.error(
      `Error: listing files in directory ${dir} failed with error ${e}. Skipping.`
    );
    return files;
  }
}

console.log(`Listing files from: ${absolutePath}\n`);

(() => {
  console.log("files: ", listFilesSync(absolutePath));
})();
