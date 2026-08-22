import path from "node:path";
import { isMap, parse, parseDocument, type YAMLMap } from "yaml";
import { getFilesContent } from "./configuration.js";
import { createDir, writeFile, readFile } from "./files.js";
import { Export2dFormat, ParameterSet } from "openscad-cli-wrapper";
import { ExportAllFormat, GeneratedFormat } from "../types.js";

export function update(openscadFile: string, force: boolean, addGenerateScript: boolean) {
  const filePath = path.parse(openscadFile);
  updateConfig(filePath);
  writeFile(`${filePath.dir || "."}/${filePath.name}.md`, getFilesContent(filePath.name).readme, force);
  createDir(`${filePath.dir || "."}/photos`);
  writeFile(`${filePath.dir || "."}/photos/.placeholder`, "", force);
  if (addGenerateScript) {
    writeFile(
      `${filePath.dir || "."}/generate_${filePath.name}.sh`,
      getFilesContent(filePath.name).generateScript,
      force,
    );
    writeFile(`${filePath.dir || "."}/deploy_${filePath.name}.sh`, getFilesContent(filePath.name).deployScript, force);
    writeFile(`${filePath.dir || "."}/.gitignore`, "gen\n", force);
  }
}

function updateConfig(filePath: path.ParsedPath) {
  const configurationFilePath = `${filePath.dir || "."}/${filePath.name}.yaml`;
  const updatedContent = updateConfigFile(readFile(configurationFilePath), getFilesContent(filePath.name).config);
  const doc = parseDocument(updatedContent);
  const genFiles = getGeneratedFiles(filePath, parse(updatedContent)["outFormats"] as ExportAllFormat[]);
  genFiles.images.unshift(`${filePath.dir || "."}/gen/mosaic_${filePath.name}.jpg`);
  genFiles.images.unshift(`${filePath.dir || "."}/gen/slideShow_${filePath.name}.webp`);
  genFiles.files.unshift(`${filePath.dir || "."}/${filePath.name}.json`);
  genFiles.files.unshift(`${filePath.dir || "."}/${filePath.name}.scad`);
  doc.setIn(["thingiverse", "images"], genFiles.images);
  doc.setIn(["thingiverse", "files"], genFiles.files);
  writeFile(configurationFilePath, String(doc), true);
}

export function updateConfigFile(existingContent: string, referenceConfigFileContent: string) {
  const existingDoc = parseDocument(existingContent);
  const referenceDoc = parseDocument(referenceConfigFileContent);

  if (!isMap(existingDoc.contents) || !isMap(referenceDoc.contents)) {
    throw new Error("Invalid YAML document structure");
  }
  mergeYamlMap(existingDoc.contents, referenceDoc.contents);
  return String(existingDoc);
}

function mergeYamlMap(existingMap: YAMLMap, refMap: YAMLMap): void {
  for (const refPair of refMap.items) {
    const refKey = String(refPair.key);
    const existingPair = existingMap.items.find((p) => String(p.key) === refKey);
    if (!existingPair) {
      existingMap.items.push(refPair);
    } else if (isMap(existingPair.value) && isMap(refPair.value)) {
      mergeYamlMap(existingPair.value, refPair.value);
    }
  }
}

function getGeneratedFiles(filePath: path.ParsedPath, formats: ExportAllFormat[]) {
  const presetFilePath = `${filePath.dir || "."}/${filePath.name}.json`;
  const parameterSets: ParameterSet = JSON.parse(readFile(presetFilePath)) satisfies ParameterSet;
  const images: string[] = [];
  const files: string[] = [];
  for (const parameterSet in parameterSets.parameterSets) {
    for (const format of formats) {
      if (
        Object.values(Export2dFormat).includes(format as Export2dFormat) ||
        Object.values(GeneratedFormat).includes(format as GeneratedFormat)
      ) {
        images.push(`${filePath.dir || "."}/gen/${filePath.name}_${parameterSet}.${getFileFormatExtension(format)}`);
      } else {
        files.push(`${filePath.dir || "."}/gen/${filePath.name}_${parameterSet}.${getFileFormatExtension(format)}`);
      }
    }
  }
  return { images, files };
}

function getFileFormatExtension(format: ExportAllFormat): string {
  switch (format) {
    case "asciistl":
    case "binstl":
      return "stl";
    default:
      return format;
  }
}
