#!/usr/bin/env node

import * as Commander from "commander";
import { unicorn } from "./util/unicorn.js";
import { allFormats, defaultFormats, ExportAllFormat, GenerateOptions } from "./types.js";
import { generate } from "./generation.js";
import { getDefaultOpenscadOptions, loadConfig } from "./configuration.js";
import { mergeDeep } from "./util/mergeDeep.js";
import { init } from "./init.js";

const program = new Commander.Command();

program.name("openscad-generate").description("CLI to some JavaScript string utilities").version("1.1.9");

program
  .command("generate")
  .description("generate from openscad file")
  .argument("<openscadFile>", "OpenSCAD file")
  .option("-p, --onlyParameterSet <ParameterSet>", "only generate this ParameterSet", "")
  .option(
    "-f, --outFormats <outFormats>",
    `list of outFormats (separated by coma) to refresh : (${allFormats.join(",")}). If not provided, all will be refreshed.`,
    "",
  )
  .option(
    "-o, --outputDir <outputDir>",
    `Output directory where the generated files will be stored. If not provided, it will be "./gen".`,
    "",
  )
  .option(
    "-m, --mosaicFormat <mosaicFormat>",
    `Generate mosaic in the format WIDTH,HEIGHT of all parameterSets. Must have format png.`,
    "",
  )
  .option(
    "-c, --configFile <configFile>",
    "Path to a config file with the parameters to use. If not provided, it will use the default parameters.",
    "",
  )
  .option(
    "-j, --parallelJobs <parallelJobs>",
    `continue on error (default: false). If true, it will continue to run even if a command (openscad, webp, imagemagic) fails.`,
    "1",
  )
  .option(
    "-D, --debugMode <debugMode>",
    `run in debug mode (default: false). If true, the command  and its output will be logged.`,
    false,
  )
  .action(async (openscadFile, options) => {
    let genOption: GenerateOptions = getDefaultOpenscadOptions();
    if (options.configFile) {
      const configFromFile = await loadConfig(options.configFile);
      genOption = mergeDeep(genOption, configFromFile) as GenerateOptions;
      if (configFromFile.outFormats) genOption.outFormats = configFromFile.outFormats;
    }
    genOption.fileName = openscadFile;
    if (options.outFormats) genOption.outFormats = toExportAllFormat(options.outFormats);
    if (options.outputDir) genOption.outputDir = options.outputDir;
    if (options.mosaicFormat) genOption.generateMosaic = !!options.mosaicFormat;
    if (options.onlyParameterSet) genOption.onlyParameterSet = options.onlyParameterSet;
    if (options.parallelJobs) genOption.parallelJobs = CheckParseInt(options.parallelJobs) ?? 1;
    if (options.mosaicFormat) genOption.mosaicOptions.tiles = toMosaicFormat(options.mosaicFormat);
    if (options.debugMode) genOption.openScadOptions.debug = active(options.debugMode);
    if (genOption.openScadOptions.debug) console.log("Configuration", genOption);
    return generate(genOption);
  });

program
  .command("init")
  .description("init project with sample files")
  .argument("<openscadFile>", "OpenSCAD file")
  .option(
    "-f, --force <force>",
    `force overwrite existing files (default: false). If true, it will overwrite existing files. (use the Force Luke!)`,
    false,
  )
  .action((openscadFile, options) => init(openscadFile, active(options.force)));

program
  .command("unicorn")
  .description("unicorn say")
  .argument("<sentence>", "what the unicorn have to say")
  .action((str) => console.log(unicorn(str)));

program.parse();

function toExportAllFormat(formats: string): ExportAllFormat[] {
  if (!formats) return defaultFormats;
  const values = formats.split(",").map((v) => v.trim());
  const invalid = values.filter((v) => !allFormats.includes(v));
  if (invalid.length) {
    throw new Error(`Invalid formats: ${invalid.join(", ")}`);
  }
  return (values as ExportAllFormat[]) ?? defaultFormats;
}

function active(v: string): boolean {
  const value = ("" + v).toLowerCase();
  return value === "true" || value === "on" || value === "yes" || value === "1";
}

function toMosaicFormat(value: string):
  | {
      width: number;
      height: number;
    }
  | undefined {
  if (!value) return undefined;
  const val = value?.split(",", 2);
  return {
    width: parseInt(val[0]),
    height: parseInt(val[1]),
  };
}

function CheckParseInt(value) {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new Commander.InvalidArgumentError("Not a number.");
  }
  return parsedValue;
}
