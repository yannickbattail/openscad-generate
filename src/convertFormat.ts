import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import {
  Export3dFormat,
  OpenScad,
  OpenScadOutputWithSummary,
  ParameterFileSet,
  ParameterSet,
} from "openscad-cli-wrapper";
import { ExportAllFormat, GenerateOptions } from "./types.js";
import { deepClone } from "./util/deepClone.js";
import { Enhance3mf } from "./util/Enhance3mf.js";

export async function convertInFormat(
  format: ExportAllFormat,
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  options: GenerateOptions,
): Promise<OpenScadOutputWithSummary | null> {
  try {
    if (format === Export3dFormat["3mf"]) {
      return gen3mf(openscad, parameterFileSet, format as Export3dFormat, options);
    } else if (Object.values(Export3dFormat).includes(format as Export3dFormat)) {
      return genModel(openscad, parameterFileSet, format as Export3dFormat, options);
    } else {
      throw new Error(`💥 Error unknown format: ${format}`);
    }
  } catch (error) {
    console.error(`💥 Error generating parameter set: ${parameterFileSet.parameterName} in format ${format}`, error);
    return null;
  }
}

async function genImage(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  options: GenerateOptions,
): Promise<OpenScadOutputWithSummary> {
  console.log(chalk.green(`➡️ Generating image for parameter set: ${parameterFileSet.parameterName}`));
  const openScadOutputWithSummary = await openscad.generateImage(parameterFileSet, options.openScadOptions);
  console.log(chalk.green(`✅ Success generating image for parameter set: ${parameterFileSet.parameterName}`));
  return openScadOutputWithSummary;
}
async function genModel(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  format: Export3dFormat,
  options: GenerateOptions,
): Promise<OpenScadOutputWithSummary> {
  console.log(chalk.green(`➡️ Generating model for parameter set: ${parameterFileSet.parameterName}`));
  const openScadOutputWithSummary = await openscad.generateModel(parameterFileSet, format, options.openScadOptions);
  console.log(chalk.green(`✅ Success generating model for parameter set: ${parameterFileSet.parameterName}`));
  return openScadOutputWithSummary;
}

function enhance3mf(options: GenerateOptions, summary: OpenScadOutputWithSummary, parameterFileSet: ParameterFileSet) {
  if (options.embedSourcesIn3mf || options.embedThumbnailIn3mf) {
    const enhance = new Enhance3mf(summary.file);
    if (options.embedThumbnailIn3mf) {
      enhance.addThumbnail();
      console.log(chalk.green(`ℹ️ Added thumbnail to ${parameterFileSet.parameterName}`));
    }
    if (options.embedSourcesIn3mf) {
      enhance.addSourceFile(summary.modelFile);
      enhance.addParameterSet(parameterFileSet);
      console.log(chalk.green(`ℹ️ Added sources to ${parameterFileSet.parameterName}`));
    }
    enhance.save();
  }
}

async function gen3mf(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  format: Export3dFormat,
  options: GenerateOptions,
): Promise<OpenScadOutputWithSummary> {
  const newOptions = deepClone(options);
  const opt3mf = newOptions.openScadOptions.option3mf;
  opt3mf.meta_data_title = replaceVars(opt3mf.meta_data_title, newOptions, parameterFileSet);
  opt3mf.meta_data_description = replaceVars(opt3mf.meta_data_description, newOptions, parameterFileSet);
  const summary = await genModel(openscad, parameterFileSet, format, newOptions);
  await genImage(openscad, parameterFileSet, options);
  enhance3mf(options, summary, parameterFileSet);
  return summary;
}

function replaceVars(pattern: string, options: GenerateOptions, parameterFileSet: ParameterFileSet): string {
  const vars: Record<string, string> = {
    FILE_NAME: path.parse(options.fileName).base,
    BASE_FILE_NAME: path.parse(options.fileName).name,
    PARAMETER_SET: parameterFileSet.parameterName,
    GENERATION_DATE: new Date().toISOString(),
    PARAMETERS: JSON.stringify(getParamSet(parameterFileSet), null, 0),
  };
  for (const [key, value] of Object.entries(vars)) {
    pattern = pattern.replaceAll(`__${key}__`, value);
  }
  return pattern;
}

function getParamSet(parameterFileSet: ParameterFileSet) {
  const parameterSet = JSON.parse(fs.readFileSync(parameterFileSet.parameterFile, "utf8")) as ParameterSet;
  return parameterSet.parameterSets[parameterFileSet.parameterName];
}
