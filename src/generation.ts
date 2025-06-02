import * as path from "node:path";
import * as fs from "node:fs";
import chalk from "chalk";
import pLimit, { LimitFunction } from "p-limit";

import { createFctExecCommand } from "./util/execBash.js";
import { defaultFormats, GenerateOptions } from "./types.js";
import { ColorScheme, OpenScad, OpenScadOutputWithSummary, ParameterSet, precision, Unit } from "openscad-cli-wrapper";
import { genParamSetInFormat } from "./generateFormat.js";
import { GenerateMosaic } from "./util/MosaicGeneration.js";

export function getDefaultOpenscadOptions(): GenerateOptions {
  return {
    fileName: "",
    outputDir: "./gen",
    outFormats: defaultFormats,
    parallelJobs: 1,
    onlyParameterSet: "",
    generateMosaic: false,
    mosaicOptions: {
      geometry: {
        width: 256,
        height: 256,
        border: 2,
      },
      tiles: {
        width: 2,
        height: 2,
      },
      debug: false,
    },
    openScadOptions: {
      animOptions: {
        animDelay: 50,
        animate: 50,
        animate_sharding: null,
        autocenter: false,
        camera: null,
        colorscheme: ColorScheme.DeepOcean,
        csglimit: null,
        imgsize: {
          height: 512,
          width: 515,
        },
        preview: null,
        projection: null,
        render: null,
        view: null,
        viewall: false,
      },
      backend: "Manifold",
      check_parameter_ranges: false,
      check_parameters: false,
      debug: null,
      experimentalFeatures: {
        import_function: true,
        input_driver_dbus: false,
        lazy_union: true,
        predictible_output: true,
        python_engine: false,
        roof: true,
        textmetrics: true,
        vertex_object_renderers_indexing: true,
      },
      hardwarnings: false,
      imageOptions: {
        autocenter: false,
        camera: null,
        colorscheme: ColorScheme.DeepOcean,
        csglimit: null,
        imgsize: {
          height: 1024,
          width: 1024,
        },
        preview: null,
        projection: null,
        render: null,
        view: null,
        viewall: false,
      },
      openScadExecutable: "openscad",
      option3mf: {
        add_meta_data: "true",
        color: "",
        color_mode: "model",
        decimal_precision: precision.c6,
        material_type: "basematerial",
        meta_data_copyright: "",
        meta_data_description: "",
        meta_data_designer: "",
        meta_data_license_terms: "",
        meta_data_rating: "",
        meta_data_title: "",
        unit: Unit.millimeter,
      },
      python_module: null,
      quiet: false,
      trust_python: false,
    },
  };
}

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
