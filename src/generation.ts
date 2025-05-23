import * as path from "node:path";
import * as fs from "node:fs";
import {
  animOptions,
  Export2dFormat,
  Export3dFormat,
  getOptions,
  imageOptions,
  OpenScad,
  option3mf,
  ParameterFileSet,
  ParameterSet,
  ParameterSetName,
} from "openscad-cli-wrapper";

import { execOutput } from "./util/execBash.js";
import chalk from "chalk";
import { GenerateAnimation } from "./util/AnimationGeneration.js";
import { GenerateMosaic } from "./util/MosaicGeneration.js";
import { defaultFormats, ExportAllFormat, GeneratedFormat } from "./types.js";

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

export function generate(
  fileName: string,
  outFormats: ExportAllFormat[],
  onlyParameterSetNames?: string,
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
  const openscad = new OpenScad(fileName, options, execOutput);

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
    for (const key in parameterSet.parameterSets) {
      if (!onlyParameterSetNames || onlyParameterSetNames === key) {
        const parameterFileSet: ParameterFileSet = {
          parameterFile: parameterSetFileName,
          parameterName: key,
        };
        options.suffix = key;
        generateParamSet(openscad, parameterFileSet, formats);
      }
    }
  } catch (error) {
    console.error("Error reading or parsing the JSON file:", error);
  }
}

function generateParamSet(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  outFormats: ExportAllFormat[],
) {
  for (const format of outFormats ?? defaultFormats) {
    try {
      console.log(
        chalk.green(
          `Generating model for parameter set: ${parameterFileSet.parameterName} to format: ${format}`,
        ),
      );
      genParamSetInFormat(format, openscad, parameterFileSet);
    } catch (e) {
      console.error(
        chalk.red(
          `Error generating model for parameter set: ${parameterFileSet.parameterName} in format: ${format}`,
        ),
        e,
      );
    }
  }
}

function genParamSetInFormat(
  format: ExportAllFormat,
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
) {
  if (Object.values(Export2dFormat).includes(format as Export2dFormat)) {
    openscad.generateImage(parameterFileSet, imageOptions);
  } else if (format === GeneratedFormat.webp) {
    genAnimation(openscad, parameterFileSet);
  } else if (format === GeneratedFormat.jpg) {
    genMosaic(openscad, parameterFileSet);
  } else if (Object.values(Export3dFormat).includes(format as Export3dFormat)) {
    openscad.generateModel(
      parameterFileSet,
      format as Export3dFormat,
      option3mf,
    );
  }
}

function genAnimation(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
): void {
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
  let out = openscad.generateAnimation(paramSetName, animOptions);
  GenerateAnimation(out, animOptions.animDelay);
  options.suffix = orig_suffix;
}

function genMosaic(
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
): void {
  GenerateMosaic(parameterFileSet);
}
