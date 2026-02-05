import fs from "fs";
import path from "path";

// Path to your translation file (vi.ts)
const translationFilePath = path.resolve("./src/language/locales/vi.ts");

// Directories where your components and pages are located
const foldersToScan = ["./src/components", "./src/pages"];

// Load and parse vi.ts to extract the translation keys and values
const translationFile = fs.readFileSync(translationFilePath, "utf8");

// Regex to match key-value pairs in vi.ts
const translationRegex = /(\w+):\s*"(.+?)"/g;
let match;
const translations = {};

// Build a dictionary of translations where the text is the key and the key from vi.ts is the value
while ((match = translationRegex.exec(translationFile)) !== null) {
  const key = match[1];
  const value = match[2];
  translations[value] = key;
}

// Function to scan files and replace hardcoded strings with t('key')
function replaceStringsInFiles(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);

    // Recurse if it's a directory
    if (fs.lstatSync(fullPath).isDirectory()) {
      replaceStringsInFiles(fullPath);
    } else if (
      fullPath.endsWith(".tsx") ||
      fullPath.endsWith(".js") ||
      fullPath.endsWith(".jsx") ||
      fullPath.endsWith(".ts")
    ) {
      let content = fs.readFileSync(fullPath, "utf8");
      let modified = false;

      // Replace each hardcoded string with t('key')
      Object.keys(translations).forEach((string) => {
        const regex = new RegExp(`["'\`]${string}["'\`]`, "g"); // Match only exact string literals
        if (regex.test(content)) {
          content = content.replace(regex, `t('${translations[string]}')`);
          modified = true;
        }
      });

      // Avoid replacing within an existing t('key')
      const existingTRegex = /t\(["'`].+?["'`]\)/g;
      content = content.replace(existingTRegex, (match) => {
        // If the match is already wrapped with `t`, we skip it.
        return match;
      });

      // Function to remove nested `t(t('key'))`
      content = removeNestedTCalls(content);

      // If modifications were made, overwrite the file
      if (modified) {
        fs.writeFileSync(fullPath, content, "utf8");
        // console.log(`Updated file: ${fullPath}`);
      }
    }
  });
}

// Function to remove nested `t(t('key'))` and replace with `t('key')`
function removeNestedTCalls(content) {
  const nestedTRegex = /t\(\s*t\(['"`](.+?)['"`]\)\s*\)/g; // Match t(t('key'))
  return content.replace(nestedTRegex, (match, key) => {
    return `t('${key}')`; // Replace nested t() with a single t('key')
  });
}

// Start the replacement process
foldersToScan.forEach(replaceStringsInFiles);
