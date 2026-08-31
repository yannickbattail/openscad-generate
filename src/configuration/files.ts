import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { CoolLog } from "../util/CoolLog.js";

export function writeFile(filePath: string, content: string, force: boolean): void {
  if (existsSync(filePath) && !force) {
    CoolLog.warn(`File ${filePath} already exists, skipped! Use the --force option to overwrite.`);
    return;
  }
  writeFileSync(filePath, content);
  CoolLog.success(`File written: ${filePath}`);
}

export function createDir(filePath: string): void {
  if (existsSync(filePath)) {
    CoolLog.warn(`Directory ${filePath} already exists, skipped!`);
    return;
  }
  mkdirSync(filePath);
  CoolLog.success(`Directory created: ${filePath}`);
}

export function readFile(filePath: string): string {
  if (!existsSync(filePath)) {
    CoolLog.warn(`File ${filePath} does mot exist.`);
    return "";
  }
  return readFileSync(filePath, "utf-8");
}

export function readDir(filePath: string): string[] {
  if (!existsSync(filePath)) {
    CoolLog.warn(`File ${filePath} does mot exist.`);
    return [];
  }
  return readdirSync(filePath);
}
