#!/usr/bin/env node

import * as Commander from "commander";
import { unicorn } from "./util/unicorn.js";
import { allFormats, defaultFormats, ExportAllFormat } from "./types.js";
import { generate } from "./generation.js";

const program = new Commander.Command();

program.name("openscad-generate").description("CLI to some JavaScript string utilities").version("1.0.7");

program
  .command("generate")
  .description("generate from openscad file")
  .argument("<openscadFile>", "string to split")
  .option("-p, --onlyParameterSet <ParameterSet>", "only generate this ParameterSet")
  .option(
    "-o, --outFormats <outFormats>",
    `list of outFormats (separated by coma) to refresh : (${allFormats.join(",")}). If not provided, all will be refreshed.`,
    toExportAllFormat,
  )
  .option(
    "-m, --mosaicFormat <mosaicFormat>",
    `Generate mosaic in the format WIDTH,HEIGHT of all parameterSets. Must have format png.`,
    toMosaicFormat,
  )
  .option(
    "-c, --continueOnError <continueOnError>",
    `continue on error (default: false). If true, it will continue to run even if a command (openscad, webp, imagemagic) fails.`,
    "false",
  )
  .option(
    "-j, --parallelJobs <parallelJobs>",
    `continue on error (default: false). If true, it will continue to run even if a command (openscad, webp, imagemagic) fails.`,
    CheckParseInt,
  )
  .option(
    "-D, --debugMode <debugMode>",
    `run in debug mode (default: false). If true, the command  and its output will be logged.`,
    active,
  )
  .action((openscadFile, options) =>
    generate({
      fileName: openscadFile,
      outFormats: options.outFormats,
      mosaicFormat: options.mosaicFormat,
      onlyParameterSet: options.onlyParameterSet,
      parallelJobs: options.parallelJobs ?? 1,
      debugMode: options.debugMode,
    }),
  );

program
  .command("unicorn")
  .description("unicorn say")
  .argument("<sentence>", "what the unicorn have to say")
  .action((str) => console.log(unicorn(str)));

program.parse();

function toExportAllFormat(formats: string): ExportAllFormat[] {
  console.log(`base formats: ${formats}`);
  if (!formats) return defaultFormats;
  const values = formats.split(",").map((v) => v.trim());
  const invalid = values.filter((v) => !allFormats.includes(v));
  if (invalid.length) {
    throw new Error(`Invalid formats: ${invalid.join(", ")}`);
  }
  return values as ExportAllFormat[];
}

function active(value: string): boolean {
  return (
    value.toLowerCase() === "true" || value.toLowerCase() === "on" || value.toLowerCase() === "yes" || value === "1"
  );
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
