import { ExportAllFormat, GeneratedFormat } from "./types.js";
import {
  Executor,
  Export2dFormat,
  Export3dFormat,
  OpenScad,
  OpenScadOptions,
  OpenScadOutputWithSummary,
  ParameterFileSet,
  ParameterSet,
  ParameterSetName,
} from "openscad-cli-wrapper";
import chalk from "chalk";
import fs from "node:fs";
import { GenerateAnimation } from "./util/AnimationGeneration.js";

export async function genParamSetInFormat(
  format: ExportAllFormat,
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  options: OpenScadOptions,
  executor: Executor,
): Promise<OpenScadOutputWithSummary> {
  if (Object.values(Export2dFormat).includes(format as Export2dFormat)) {
    return genImage(openscad, parameterFileSet, options);
  } else if (format === GeneratedFormat.webp) {
    return genAnimation(openscad, parameterFileSet, options, executor);
  } else if (Object.values(Export3dFormat).includes(format as Export3dFormat)) {
    return genModel(openscad, parameterFileSet, format as Export3dFormat, options);
  } else {
    throw new Error(`Unknown format: ${format}`);
  }
}

async function genImage(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  options: OpenScadOptions,
): Promise<OpenScadOutputWithSummary> {
  console.log(chalk.green(`➡️ Generating image for parameter set: ${parameterFileSet.parameterName}`));
  const openScadOutputWithSummary = await openscad.generateImage(parameterFileSet, options);
  console.log(chalk.green(`✅ Success generating image for parameter set: ${parameterFileSet.parameterName}`));
  return openScadOutputWithSummary;
}

async function genAnimation(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  options: OpenScadOptions,
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
  const out = await openscad.generateAnimation(paramSetName, options);
  const outAnim = await GenerateAnimation(out, options.animOptions?.animDelay ?? 100, executor);
  console.log(chalk.green(`✅ Success generating animation for parameter set: ${parameterFileSet.parameterName}`));
  return outAnim;
}

async function genModel(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  format: Export3dFormat,
  options: OpenScadOptions,
): Promise<OpenScadOutputWithSummary> {
  console.log(chalk.green(`➡️ Generating model for parameter set: ${parameterFileSet.parameterName}`));
  const openScadOutputWithSummary = await openscad.generateModel(parameterFileSet, format, options);
  console.log(chalk.green(`✅ Success generating model for parameter set: ${parameterFileSet.parameterName}`));
  return openScadOutputWithSummary;
}
