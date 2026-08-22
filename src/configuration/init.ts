import path from "node:path";
import { getFilesContent } from "./configuration.js";
import { createDir, writeFile } from "./files.js";

export function init(openscadFile: string, force: boolean, addGenerateScript: boolean) {
  const filePath = path.parse(openscadFile);
  const filesContent = getFilesContent(filePath.name);
  writeFile(`${filePath.dir || "."}/${filePath.name}.scad`, filesContent.openscad, false);
  writeFile(`${filePath.dir || "."}/${filePath.name}.json`, filesContent.preset, false);
  writeFile(`${filePath.dir || "."}/${filePath.name}.yaml`, filesContent.config, force);
  writeFile(`${filePath.dir || "."}/${filePath.name}.md`, filesContent.readme, force);
  createDir(`${filePath.dir || "."}/photos`);
  writeFile(`${filePath.dir || "."}/photos/.placeholder`, "", force);
  if (addGenerateScript) {
    writeFile(`${filePath.dir || "."}/generate_${filePath.name}.sh`, filesContent.generateScript, force);
    writeFile(`${filePath.dir || "."}/deploy_${filePath.name}.sh`, filesContent.deployScript, force);
    writeFile(`${filePath.dir || "."}/.gitignore`, "gen\n", force);
  }
}
