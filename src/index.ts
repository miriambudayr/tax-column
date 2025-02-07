import fs from "fs";
import path from "path";

export function listFilesSync(dir: string, files: string[] = []): string[] {
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

export function tokenize(text: string): string[] {
  const cleanText = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
  return cleanText.split(/\s+/).filter(Boolean);
}
