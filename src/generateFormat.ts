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
import { GenerateAnimation } from "./util/AnimationGeneration.js";
import { deepClone } from "./util/deepClone.js";
import path from "node:path";

export async function genParamSetInFormat(
  format: ExportAllFormat,
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  options: GenerateOptions,
  executor: Executor,
): Promise<OpenScadOutputWithSummary> {
  if (Object.values(Export2dFormat).includes(format as Export2dFormat)) {
    return genImage(openscad, parameterFileSet, options);
  } else if (format === GeneratedFormat.webp) {
    return genAnimation(openscad, parameterFileSet, options, executor);
  } else if (format === Export3dFormat["3mf"]) {
    return gen3mf(openscad, parameterFileSet, format as Export3dFormat, options);
  } else if (Object.values(Export3dFormat).includes(format as Export3dFormat)) {
    return genModel(openscad, parameterFileSet, format as Export3dFormat, options);
  } else {
    throw new Error(`Unknown format: ${format}`);
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
  options: GenerateOptions,
  executor: Executor,
): Promise<OpenScadOutputWithSummary> {
  console.log(chalk.green(`➡️ Generating animation for parameter set: ${parameterFileSet.parameterName}`));
  const fileContent = fs.readFileSync(parameterFileSet.parameterFile, "utf-8");
  const parameterSet = JSON.parse(fileContent) satisfies ParameterSet as ParameterSet;
  parameterSet.parameterSets[parameterFileSet.parameterName]["animation_rotation"] = "true";
  const paramSetName: ParameterSetName = {
    parameterSet: parameterSet,
    parameterName: parameterFileSet.parameterName,
  };
  const out = await openscad.generateAnimation(paramSetName, options.openScadOptions);
  const outAnim = await GenerateAnimation(out, options.openScadOptions.animOptions?.animDelay ?? 100, executor);
  console.log(chalk.green(`✅ Success generating animation for parameter set: ${parameterFileSet.parameterName}`));
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
  console.log(chalk.green(`➡️ Generating model for parameter set: ${parameterFileSet.parameterName}`));
  const newOptions = deepClone(options);
  const baseName = path.parse(options.fileName).name;
  newOptions.openScadOptions.option3mf.meta_data_title = `${baseName} - ${parameterFileSet.parameterName}`;
  newOptions.openScadOptions.option3mf.meta_data_description = `${baseName} - ${parameterFileSet.parameterName} made with OpenSCAD`;
  const openScadOutputWithSummary = await openscad.generateModel(parameterFileSet, format, newOptions.openScadOptions);
  console.log(chalk.green(`✅ Success generating model for parameter set: ${parameterFileSet.parameterName}`));
  return openScadOutputWithSummary;
}
