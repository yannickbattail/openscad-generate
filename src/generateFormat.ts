import { ExportAllFormat, GeneratedFormat } from "./types.js";
import {
  animOptions,
  Executor,
  Export2dFormat,
  Export3dFormat,
  imageOptions,
  OpenScad,
  OpenScadOutputWithSummary,
  option3mf,
  ParameterFileSet,
  ParameterSet,
  ParameterSetName,
} from "openscad-cli-wrapper";
import chalk from "chalk";
import fs from "node:fs";
import { GenerateAnimation } from "./util/AnimationGeneration.js";
import { GenerateMosaic } from "./util/MosaicGeneration.js";

export async function genParamSetInFormat(
  format: ExportAllFormat,
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  executor: Executor,
): Promise<OpenScadOutputWithSummary> {
  if (Object.values(Export2dFormat).includes(format as Export2dFormat)) {
    return genImage(openscad, parameterFileSet);
  } else if (format === GeneratedFormat.webp) {
    return genAnimation(openscad, parameterFileSet, executor);
  } else if (format === GeneratedFormat.jpg) {
    return genMosaic(openscad, parameterFileSet, executor);
  } else if (Object.values(Export3dFormat).includes(format as Export3dFormat)) {
    return genModel(openscad, parameterFileSet, format as Export3dFormat);
  } else {
    throw new Error(`Unknown format: ${format}`);
  }
}

async function genImage(openscad: OpenScad, parameterFileSet: ParameterFileSet): Promise<OpenScadOutputWithSummary> {
  console.log(chalk.green(`➡️ Generating image for parameter set: ${parameterFileSet.parameterName}`));
  const openScadOutputWithSummary = await openscad.generateImage(parameterFileSet, imageOptions);
  console.log(chalk.green(`✅ Success generating image for parameter set: ${parameterFileSet.parameterName}`));
  return openScadOutputWithSummary;
}

async function genAnimation(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
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
  const out = await openscad.generateAnimation(paramSetName, animOptions);
  const outAnim = await GenerateAnimation(out, animOptions.animDelay, executor);
  console.log(chalk.green(`✅ Success generating animation for parameter set: ${parameterFileSet.parameterName}`));
  return outAnim;
}

async function genModel(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  format: Export3dFormat,
): Promise<OpenScadOutputWithSummary> {
  console.log(chalk.green(`➡️ Generating model for parameter set: ${parameterFileSet.parameterName}`));
  const openScadOutputWithSummary = await openscad.generateModel(parameterFileSet, format, option3mf);
  console.log(chalk.green(`✅ Success generating model for parameter set: ${parameterFileSet.parameterName}`));
  return openScadOutputWithSummary;
}

async function genMosaic(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  executor: Executor,
): Promise<OpenScadOutputWithSummary> {
  console.log(chalk.green(`➡️ Generating mosaic for parameter set: ${parameterFileSet.parameterName}`));
  const openScadOutputWithSummary = await GenerateMosaic(parameterFileSet, executor);
  console.log(chalk.green(`✅ Success generating mosaic for parameter set: ${parameterFileSet.parameterName}`));
  return openScadOutputWithSummary;
}
