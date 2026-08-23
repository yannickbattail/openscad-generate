import path from "node:path";
import { isMap, parse, parseDocument, type YAMLMap } from "yaml";
import { getFilesContent } from "./configuration.js";
import { createDir, writeFile, readFile, readDir } from "./files.js";
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
  const { images, files } = getGeneratedFiles(filePath, parse(updatedContent)["outFormats"] as ExportAllFormat[]);
  const photos = getPhotos(filePath);
  images.unshift(`${filePath.dir || "."}/gen/mosaic_${filePath.name}.jpg`);
  images.unshift(`${filePath.dir || "."}/gen/slideShow_${filePath.name}.webp`);
  images.unshift(...photos);
  files.unshift(`${filePath.dir || "."}/${filePath.name}.json`);
  files.unshift(`${filePath.dir || "."}/${filePath.name}.scad`);
  doc.setIn(["thingiverse", "images"], images);
  doc.setIn(["thingiverse", "files"], files);
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

function getPhotos(filePath: path.ParsedPath): string[] {
  const name = filePath.name;
  const photosDir = `${filePath.dir || "."}/photos`;
  const files = readDir(photosDir);
  const photos = files.filter(
    (file) =>
      file.startsWith(name) &&
      (file.endsWith(".jpg") ||
        file.endsWith(".jpeg") ||
        file.endsWith(".png") ||
        file.endsWith(".gif") ||
        file.endsWith(".webp")),
  );
  return photos.map((photo) => `${photosDir}/${photo}`);
}

function getGeneratedFiles(
  filePath: path.ParsedPath,
  formats: ExportAllFormat[],
): {
  images: string[];
  files: string[];
} {
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
