import fs from "fs";
import path from "path";

// Path to your translation file (vi.ts)
const translationFilePath = path.resolve("./src/language/locales/vi.ts");

// Directories where your components and pages are located
const foldersToScan = ["./src/components", "./src/pages"];

// Load and parse vi.ts to extract the translation keys and values
let translationFile = fs.readFileSync(translationFilePath, "utf8");

// Regex to match key-value pairs in vi.ts
const translationRegex = /(\w+):\s*"(.+?)"/g;
let match;
const translations = {};

// Build a dictionary of translations where the text is the key and the key from vi.ts is the value
while ((match = translationRegex.exec(translationFile)) !== null) {
  const key = match[1];
  const value = match[2];
  translations[value] = key; // Map value to key
}

// Function to scan files and find hardcoded Vietnamese strings
function findUndefinedKeysInFiles(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);

    // Recurse if it's a directory
    if (fs.lstatSync(fullPath).isDirectory()) {
      findUndefinedKeysInFiles(fullPath);
    } else if (
      fullPath.endsWith(".tsx") ||
      fullPath.endsWith(".js") ||
      fullPath.endsWith(".jsx") ||
      fullPath.endsWith(".ts")
    ) {
      let content = fs.readFileSync(fullPath, "utf8");

      // Find all hardcoded strings (Vietnamese)
      const stringRegex = /["'`](.+?)["'`]/g; // Match all string literals
      let stringMatch;
      const undefinedStrings = [];

      while ((stringMatch = stringRegex.exec(content)) !== null) {
        const stringValue = stringMatch[1];
        // Check if the stringValue does not exist in translations
        if (!translations[stringValue] && isVietnamese(stringValue)) {
          undefinedStrings.push(stringValue); // Collect undefined Vietnamese strings
        }
      }

      // Log undefined strings if any
      if (undefinedStrings.length > 0) {
        // console.log(`Undefined Vietnamese strings in file ${fullPath}:`);
        undefinedStrings.forEach((str) => console.log(`${str}`));
      }
    }
  });
}

// Function to determine if a string is Vietnamese
function isVietnamese(string) {
  const vietnameseRegex =
    /[àáạảãâầấậẩẫäèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữ]/i;
  return vietnameseRegex.test(string); // Check for Vietnamese characters
}

// Start the scanning process
foldersToScan.forEach(findUndefinedKeysInFiles);

// console.log('Undefined Vietnamese key search completed.');
