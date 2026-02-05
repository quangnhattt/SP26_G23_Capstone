import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the paths to the directories
const directories = ["icons", "images"];

// Initialize arrays to hold import and export statements
const imports = [];
const exports = [];

// Function to process each directory
const processDirectory = (dir) => {
  const dirPath = path.join(__dirname, "..", "src", "assets", dir);
  // console.log(`Processing directory: ${dir}`);
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (file.match(/\.(png|jpe?g|svg)$/)) {
      const name = path.basename(file, path.extname(file)).replace(".", "_");
      const replacedName = name.replace(/-/g, "_");

      const variableName =
        name.charAt(0).toUpperCase() +
        name.slice(1) +
        dir.charAt(0).toUpperCase() +
        dir.slice(1);
      // console.log(`  ${name} (${variableName})`);
      imports.push(`import ${replacedName} from './${dir}/${file}';`);
      exports.push(`  ${replacedName},`);
    }
  });
};

// Process each directory
directories.forEach((dir) => processDirectory(dir));

// Create the output file content
const output = `
${imports.join("\n")}

export const images = {
${exports.join("\n")}
};
`;

// Write the output file
fs.writeFileSync(
  path.join(__dirname, "..", "src", "assets", "imagesAssets.ts"),
  output,
  "utf8"
);
// console.log("imagesAssets.ts has been generated.");
