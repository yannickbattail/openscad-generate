import * as path from "node:path";
import * as fs from "node:fs";
import chalk from "chalk";
import pLimit from "p-limit";

import { createFctExecCommand } from "./util/execBash.js";
import { GenerateAnimation } from "./util/AnimationGeneration.js";
import { GenerateMosaic } from "./util/MosaicGeneration.js";
import { defaultFormats, ExportAllFormat, GeneratedFormat } from "./types.js";
import {
  animOptions,
  Export2dFormat,
  Export3dFormat,
  getOptions,
  imageOptions,
  OpenScad,
  OpenScadOutputWithSummary,
  option3mf,
  ParameterFileSet,
  ParameterSet,
  ParameterSetName,
} from "openscad-cli-wrapper";

const options = getOptions();
options.outputDir = "./gen";
options.suffix = null;

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

export async function generate(
  fileName: string,
  outFormats: ExportAllFormat[],
  onlyParameterSetNames: string,
  continueOnError: boolean,
  debugMode: boolean,
) {
  const formats = outFormats ? outFormats : defaultFormats;
  console.log(
    chalk.green(
      `Generating model for file: ${fileName} in formats: ${formats}`,
    ),
  );

  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir);
  }
  const execCmd = createFctExecCommand(!debugMode, debugMode);

  const openscad = new OpenScad(fileName, options, execCmd);

  const fileNameWithoutExtension = path.basename(
    fileName,
    path.extname(fileName),
  );
  const parameterSetFileName = fileNameWithoutExtension + ".json";
  try {
    const fileContent = fs.readFileSync(
      fileNameWithoutExtension + ".json",
      "utf-8",
    );
    const parameterSet = JSON.parse(fileContent) satisfies ParameterSet;
    const tasks: Promise<OpenScadOutputWithSummary>[] = [];
    for (const key in parameterSet.parameterSets) {
      if (!onlyParameterSetNames || onlyParameterSetNames === key) {
        const parameterFileSet: ParameterFileSet = {
          parameterFile: parameterSetFileName,
          parameterName: key,
        };
        options.suffix = key;
        tasks.push(
          ...generateParamSet(
            openscad,
            parameterFileSet,
            formats,
            continueOnError,
            execCmd,
          ),
        );
      }
    }
    const limit = pLimit(10);
    await Promise.all(tasks.map((task) => limit(() => task)));
  } catch (error) {
    console.error("Error reading or parsing the JSON file:", error);
  }
}

function generateParamSet(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  outFormats: ExportAllFormat[],
  continueOnError: boolean,
  execCmd: (cmd: string) => Promise<string>,
): Promise<OpenScadOutputWithSummary>[] {
  const tasks: Promise<OpenScadOutputWithSummary>[] = [];
  for (const format of outFormats ?? defaultFormats) {
    try {
      tasks.push(
        genParamSetInFormat(format, openscad, parameterFileSet, execCmd),
      );
    } catch (e) {
      console.error(
        chalk.red(
          `Error generating ${format} for parameter set: ${parameterFileSet.parameterName}`,
        ),
        e,
      );
      if (!continueOnError) {
        throw e;
      }
    }
  }
  return tasks;
}

async function genParamSetInFormat(
  format: ExportAllFormat,
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  execCmd: (cmd: string) => Promise<string>,
): Promise<OpenScadOutputWithSummary> {
  if (Object.values(Export2dFormat).includes(format as Export2dFormat)) {
    return await genImage(openscad, parameterFileSet);
  } else if (format === GeneratedFormat.webp) {
    return await genAnimation(openscad, parameterFileSet, execCmd);
  } else if (format === GeneratedFormat.jpg) {
    return await genMosaic(openscad, parameterFileSet, execCmd);
  } else if (Object.values(Export3dFormat).includes(format as Export3dFormat)) {
    return await genModel(openscad, parameterFileSet, format as Export3dFormat);
  } else {
    throw new Error(`Unknown format: ${format}`);
  }
}

async function genImage(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
): Promise<OpenScadOutputWithSummary> {
  console.log(
    chalk.green(
      `➡️ Generating image for parameter set: ${parameterFileSet.parameterName}`,
    ),
  );
  const openScadOutputWithSummary = await openscad.generateImage(
    parameterFileSet,
    imageOptions,
  );
  console.log(
    chalk.green(
      `✅ Success generating image for parameter set: ${parameterFileSet.parameterName}`,
    ),
  );
  return openScadOutputWithSummary;
}

async function genAnimation(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  execCmd: (cmd: string) => Promise<string>,
): Promise<OpenScadOutputWithSummary> {
  console.log(
    chalk.green(
      `➡️ Generating animation for parameter set: ${parameterFileSet.parameterName}`,
    ),
  );
  const fileContent = fs.readFileSync(parameterFileSet.parameterFile, "utf-8");
  const parameterSet = JSON.parse(
    fileContent,
  ) satisfies ParameterSet as ParameterSet;
  parameterSet.parameterSets[parameterFileSet.parameterName][
    "animation_rotation"
  ] = "true";
  const paramSetName: ParameterSetName = {
    parameterSet: parameterSet,
    parameterName: parameterFileSet.parameterName,
  };
  const orig_suffix = options.suffix;
  options.suffix += "_animation";
  const out = await openscad.generateAnimation(paramSetName, animOptions);
  const outAnim = await GenerateAnimation(out, animOptions.animDelay, execCmd);
  options.suffix = orig_suffix;
  console.log(
    chalk.green(
      `✅ Success generating animation for parameter set: ${parameterFileSet.parameterName}`,
    ),
  );
  return outAnim;
}

async function genModel(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  format: Export3dFormat,
): Promise<OpenScadOutputWithSummary> {
  console.log(
    chalk.green(
      `➡️ Generating model for parameter set: ${parameterFileSet.parameterName}`,
    ),
  );
  const openScadOutputWithSummary = await openscad.generateModel(
    parameterFileSet,
    format,
    option3mf,
  );
  console.log(
    chalk.green(
      `✅ Success generating model for parameter set: ${parameterFileSet.parameterName}`,
    ),
  );
  return openScadOutputWithSummary;
}

async function genMosaic(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  execCmd: (cmd: string) => Promise<string>,
): Promise<OpenScadOutputWithSummary> {
  console.log(
    chalk.green(
      `➡️ Generating mosaic for parameter set: ${parameterFileSet.parameterName}`,
    ),
  );
  const openScadOutputWithSummary = await GenerateMosaic(
    parameterFileSet,
    execCmd,
  );
  console.log(
    chalk.green(
      `✅ Success generating mosaic for parameter set: ${parameterFileSet.parameterName}`,
    ),
  );
  return openScadOutputWithSummary;
}
