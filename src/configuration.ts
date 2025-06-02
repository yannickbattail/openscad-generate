import { defaultFormats, GenerateOptions } from "./types.js";
import { ColorScheme, precision, RecursivePartial, Unit } from "openscad-cli-wrapper";
import fs from "node:fs";

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
        material_type: "color",
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

export async function loadConfig(configPath: string): Promise<GenerateOptions> {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }
  const configContent = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(configContent) satisfies RecursivePartial<GenerateOptions>;
}
