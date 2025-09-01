import { ExportAllFormat, GeneratedFormat, GenerateOptions } from "./types.js";
import {
  Executor,
  Export2dFormat,
  Export3dFormat,
  OpenScad,
  OpenScadOutputWithSummary,
  ParameterFileSet,
  ParameterSet,
  ParameterSetName,
} from "openscad-cli-wrapper";
import chalk from "chalk";
import fs from "node:fs";
import { GenerateGifAnimation, GenerateWebpAnimation } from "./util/AnimationGeneration.js";
import { deepClone } from "./util/deepClone.js";
import path from "node:path";

export async function genParamSetInFormat(
  format: ExportAllFormat,
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  options: GenerateOptions,
  executor: Executor,
): Promise<OpenScadOutputWithSummary | null> {
  try {
    if (format === Export2dFormat.png) {
      return genImage(openscad, parameterFileSet, options);
    } else if (Object.values(Export2dFormat).includes(format as Export2dFormat)) {
      return gen2D(openscad, parameterFileSet, format as Export2dFormat, options);
    } else if (format === GeneratedFormat.webp || format === GeneratedFormat.gif) {
      return genAnimation(openscad, parameterFileSet, format, options, executor);
    } else if (format === Export3dFormat["3mf"]) {
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

async function genAnimation(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  format: GeneratedFormat,
  options: GenerateOptions,
  executor: Executor,
): Promise<OpenScadOutputWithSummary> {
  console.log(chalk.green(`➡️ Generating animation ${format} for parameter set: ${parameterFileSet.parameterName}`));
  const fileContent = fs.readFileSync(parameterFileSet.parameterFile, "utf-8");
  const parameterSet = JSON.parse(fileContent) satisfies ParameterSet as ParameterSet;
  parameterSet.parameterSets[parameterFileSet.parameterName]["animation_rotation"] = "true";
  const paramSetName: ParameterSetName = {
    parameterSet: parameterSet,
    parameterName: parameterFileSet.parameterName,
  };
  const out = await openscad.generateAnimation(paramSetName, options.openScadOptions);
  let outAnim: OpenScadOutputWithSummary;
  if (format === GeneratedFormat.webp) {
    outAnim = await GenerateWebpAnimation(
      out,
      options.openScadOptions.animOptions?.animDelay ?? 100,
      !!options.openScadOptions.debug,
      executor,
    );
  } else {
    outAnim = await GenerateGifAnimation(
      out,
      options.openScadOptions.animOptions?.animDelay ?? 100,
      !!options.openScadOptions.debug,
      executor,
    );
  }
  console.log(
    chalk.green(`✅ Success generating animation ${format} for parameter set: ${parameterFileSet.parameterName}`),
  );
  return outAnim;
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
  return genModel(openscad, parameterFileSet, format, newOptions);
}

async function gen2D(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  format: Export2dFormat,
  options: GenerateOptions,
): Promise<OpenScadOutputWithSummary> {
  const newOptions = deepClone(options);

  const optPdf = newOptions.openScadOptions.optionPdf;
  optPdf.meta_data_title = replaceVars(optPdf.meta_data_title, newOptions, parameterFileSet);
  optPdf.meta_data_subject = replaceVars(optPdf.meta_data_subject, newOptions, parameterFileSet);
  console.log(chalk.green(`➡️ Generating document for parameter set: ${parameterFileSet.parameterName}`));
  const openScadOutputWithSummary = await openscad.generate2d(parameterFileSet, format, options.openScadOptions);
  console.log(chalk.green(`✅ Success generating document for parameter set: ${parameterFileSet.parameterName}`));
  return openScadOutputWithSummary;
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
