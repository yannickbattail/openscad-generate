import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import chalk from "chalk";

export function writeFile(filePath: string, content: string, force: boolean): void {
  if (existsSync(filePath) && !force) {
    console.warn(chalk.yellow(`💥 File ${filePath} already exists, skipped! Use the --force option to overwrite.`));
    return;
  }
  writeFileSync(filePath, content);
  console.log(chalk.green(`✅ File written: ${filePath}`));
}

export function createDir(filePath: string): void {
  if (existsSync(filePath)) {
    console.warn(chalk.yellow(`💥 Directory ${filePath} already exists, skipped!`));
    return;
  }
  mkdirSync(filePath);
  console.log(chalk.green(`✅ Directory created: ${filePath}`));
}

export function readFile(filePath: string): string {
  if (!existsSync(filePath)) {
    console.warn(chalk.yellow(`💥 File ${filePath} does mot exist.`));
    return "";
  }
  return readFileSync(filePath, "utf-8");
}
