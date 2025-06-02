import * as path from "node:path";
import * as fs from "node:fs";
import chalk from "chalk";
import pLimit, { LimitFunction } from "p-limit";

import { createFctExecCommand } from "./util/execBash.js";
import { GenerateOptions } from "./types.js";
import { OpenScad, OpenScadOutputWithSummary, ParameterSet } from "openscad-cli-wrapper";
import { genParamSetInFormat } from "./generateFormat.js";
import { GenerateMosaic } from "./util/MosaicGeneration.js";

export async function generate(genOptions: GenerateOptions) {
  const executor = createFctExecCommand(!genOptions.openScadOptions.debug, !!genOptions.openScadOptions.debug);
  const limiter: LimitFunction = pLimit(genOptions.parallelJobs);
  console.log(chalk.green(`Generating model for file: ${genOptions.fileName} in formats: ${genOptions.outFormats}`));

  if (!fs.existsSync(genOptions.outputDir)) {
    fs.mkdirSync(genOptions.outputDir);
  }

  const openscad = new OpenScad(genOptions.fileName, genOptions.outputDir, executor);
  try {
    const { parameterSetFileName, paramSetToGenerate } = fetchParameterSets(genOptions);
    const tasks: Promise<OpenScadOutputWithSummary>[] = paramSetToGenerate
      .map((paramSet) =>
        genOptions.outFormats.map((format) =>
          limiter(async () =>
            genParamSetInFormat(
              format,
              openscad,
              {
                parameterFile: parameterSetFileName,
                parameterName: paramSet[0],
              },
              genOptions.openScadOptions,
              executor,
            ),
          ),
        ),
      )
      .flat();
    const result = await Promise.all(tasks);
    if (genOptions.generateMosaic) {
      const pngFiles = getPngResult(result);
      await GenerateMosaic(pngFiles, genOptions, executor);
    }
  } catch (error) {
    console.error("Error reading or parsing the JSON file:", error);
  }
}

function fetchParameterSets(genOptions: GenerateOptions) {
  const fileNameWithoutExtension = path.basename(genOptions.fileName, path.extname(genOptions.fileName));
  const parameterSetFileName = fileNameWithoutExtension + ".json";
  const fileContent = fs.readFileSync(fileNameWithoutExtension + ".json", "utf-8");
  const parameterSet: ParameterSet = JSON.parse(fileContent) satisfies ParameterSet;
  const paramSetToGenerate = Object.entries(parameterSet.parameterSets).filter(
    (paramSet) => !genOptions.onlyParameterSet || genOptions.onlyParameterSet === paramSet[0],
  );
  return { parameterSetFileName, paramSetToGenerate };
}

function getPngResult(result: OpenScadOutputWithSummary[]): string[] {
  return result.filter((r) => r.file.endsWith(".png")).map((r) => r.file);
}
