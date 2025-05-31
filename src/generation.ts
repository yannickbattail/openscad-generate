import * as path from "node:path";
import * as fs from "node:fs";
import chalk from "chalk";
import pLimit, { LimitFunction } from "p-limit";

import { createFctExecCommand } from "./util/execBash.js";
import { defaultFormats, ExportAllFormat } from "./types.js";
import { ColorScheme, OpenScad, OpenScadOptions, OpenScadOutputWithSummary, ParameterSet } from "openscad-cli-wrapper";
import { genParamSetInFormat } from "./generateFormat.js";
import { GenerateMosaic } from "./util/MosaicGeneration.js";

interface GenerateOptions {
  fileName: string;
  outFormats: ExportAllFormat[];
  mosaicFormat?: {
    width: number;
    height: number;
  };
  onlyParameterSet: string;
  parallelJobs: number;
  debugMode: boolean;
}

export function getOpenscadOptions(): OpenScadOptions {
  const options = new OpenScadOptions({});

  options.imageOptions.imgsize = {
    width: 1024,
    height: 1024,
  };
  options.imageOptions.colorscheme = ColorScheme.DeepOcean;
  options.animOptions.imgsize = {
    width: 515,
    height: 512,
  };
  options.animOptions.colorscheme = ColorScheme.DeepOcean;
  options.animOptions.animate = 50;
  options.animOptions.animDelay = 50;
  return options;
}

export async function generate(genOptions: GenerateOptions) {
  console.log(`GenerateMosaic for file: ${JSON.stringify(genOptions)}`);
  const outputDir = "./gen";
  const options = getOpenscadOptions();
  const formats = genOptions.outFormats ? genOptions.outFormats : defaultFormats;
  const executor = createFctExecCommand(!genOptions.debugMode, genOptions.debugMode);
  const limiter: LimitFunction = pLimit(genOptions.parallelJobs);
  console.log(chalk.green(`Generating model for file: ${genOptions.fileName} in formats: ${formats}`));

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const openscad = new OpenScad(genOptions.fileName, outputDir, executor);
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
              options,
              executor,
            ),
          ),
        ),
      )
      .flat();
    const result = await Promise.all(tasks);
    if (genOptions.mosaicFormat) {
      const pngFiles = getPngResult(result);
      await GenerateMosaic(
        pngFiles,
        {
          outputPath: outputDir,
          scadFileName: path.parse(genOptions.fileName).name,
          tiles: genOptions.mosaicFormat,
          debug: genOptions.debugMode,
        },
        executor,
      );
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
