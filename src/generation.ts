import * as path from "node:path";
import * as fs from "node:fs";
import chalk from "chalk";
import pLimit, { LimitFunction } from "p-limit";

import { createFctExecCommand } from "./util/execBash.js";
import { defaultFormats, ExportAllFormat } from "./types.js";
import {
  animOptions,
  getOptions,
  imageOptions,
  OpenScad,
  OpenScadOutputWithSummary,
  ParameterSet,
} from "openscad-cli-wrapper";
import { genParamSetInFormat } from "./generateFormat.js";

interface GenerateOptions {
  fileName: string;
  outFormats: ExportAllFormat[];
  onlyParameterSet: string;
  parallelJobs: number;
  debugMode: boolean;
}

export function getOpenscadOptions() {
  const options = getOptions();
  options.outputDir = "./gen";

  imageOptions.imgsize = {
    width: 1024,
    height: 1024,
  };

  animOptions.imgsize = {
    width: 515,
    height: 512,
  };
  animOptions.animate = 50;
  animOptions.animDelay = 50;
  return options;
}

export async function generate(genOptions: GenerateOptions) {
  const options = getOpenscadOptions();
  const formats = genOptions.outFormats ? genOptions.outFormats : defaultFormats;
  const executor = createFctExecCommand(!genOptions.debugMode, genOptions.debugMode);
  const limiter: LimitFunction = pLimit(genOptions.parallelJobs);
  console.log(chalk.green(`Generating model for file: ${genOptions.fileName} in formats: ${formats}`));

  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir);
  }

  const openscad = new OpenScad(genOptions.fileName, options, executor);
  try {
    const { parameterSetFileName, paramSetToGenerate } = fetchParameterSets(genOptions);
    const tasks: Promise<OpenScadOutputWithSummary>[] = paramSetToGenerate
      .map((paramSet) =>
        formats.map((format) =>
          limiter(async () =>
            genParamSetInFormat(
              format,
              openscad,
              {
                parameterFile: parameterSetFileName,
                parameterName: paramSet[0],
              },
              executor,
            ),
          ),
        ),
      )
      .flat();
    await Promise.all(tasks);
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
