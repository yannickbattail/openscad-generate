import fs from "node:fs";
import * as yaml from "js-yaml";
import { GeneratedFormat, GenerateOptions } from "./types.js";
import { ColorScheme, Export2dFormat, Export3dFormat, precision, RecursivePartial, Unit } from "openscad-cli-wrapper";

export function getDefaultOpenscadOptions(): GenerateOptions {
  return {
    fileName: "",
    generateMosaic: false,
    onlyParameterSet: "",
    parallelJobs: 1,
    outputDir: "./gen",
    outFormats: [
      Export2dFormat.png,
      //    ExportAllFormat.gif,
      //    ExportAllFormat.pdf,
      //    ExportAllFormat.svg,
      //    ExportAllFormat.dxf,
      GeneratedFormat.webp,
      //GeneratedFormat.gif,
      Export3dFormat["3mf"],
      //    Export3dFormat.stl,
      //    Export3dFormat.asciistl,
      //    Export3dFormat.binstl,
      //    Export3dFormat.off,
      //    Export3dFormat.wrl,
      //    Export3dFormat.amf,
      //    Export3dFormat.pov,
    ],
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
    },
    openScadOptions: {
      backend: "Manifold", // or "CGAL"
      check_parameter_ranges: false,
      check_parameters: false,
      debug: false,
      openScadExecutable: "openscad", // or "openscad-nightly"
      hardwarnings: false,
      quiet: false,
      trust_python: false,
      python_module: null,
      imageOptions: {
        colorscheme: ColorScheme.Starnight, //Cornfield,Metallic,Sunset,Starnight,BeforeDawn,Nature,DaylightGem,NocturnalGem,DeepOcean,Solarized,Tomorrow,TomorrowNight,ClearSky,Monotone,
        imgsize: {
          height: 1024,
          width: 1024,
        },
        autocenter: false, // adjust camera to look at object's center
        camera: null, // camera parameters when exporting png: translate_x,y,z,rot_x,y,z,dist or eye_x,y,z,center_x,y,z
        preview: null, // [=throwntogether] -for ThrownTogether preview png
        projection: null, // "o" for ortho or "p" for perspective when exporting png
        render: null, // for full geometry evaluation when exporting png
        view: null, // "axes" | "crosshairs" | "edges" | "scales";
        viewall: false, // adjust camera to fit object
        csglimit: null, // stop rendering at n CSG elements when exporting png
      },
      animOptions: {
        animDelay: 50, // delay in milliseconds between frames
        animate: 20, // number of frames
        colorscheme: ColorScheme.Starnight, //Cornfield,Metallic,Sunset,Starnight,BeforeDawn,Nature,DaylightGem,NocturnalGem,DeepOcean,Solarized,Tomorrow,TomorrowNight,ClearSky,Monotone,
        imgsize: {
          height: 100,
          width: 100,
        },
        autocenter: false, // adjust camera to look at object's center
        camera: null, // camera parameters when exporting png: translate_x,y,z,rot_x,y,z,dist or eye_x,y,z,center_x,y,z
        preview: null, // [=throwntogether] -for ThrownTogether preview png
        projection: null, // "o" for ortho or "p" for perspective when exporting png
        render: null, // for full geometry evaluation when exporting png
        view: null, // "axes" | "crosshairs" | "edges" | "scales";
        viewall: false, // adjust camera to fit object
        csglimit: null,
        animate_sharding: null,
      },
      option3mf: {
        color_mode: "model", // "model" | "none" | "selected_only".  Set to "model" useful if you want to export mutilple colors in a 3mf file
        color: "",
        material_type: "color", // "color" | "basematerial". Set to "color" useful if you want to export mutilple colors in a 3mf file
        unit: Unit.millimeter,
        decimal_precision: precision.c6,
        add_meta_data: "true",
        meta_data_copyright: "me 2025",
        meta_data_description: `__BASE_FILE_NAME__ - __PARAMETER_SET__ (made with OpenSCAD from "file __FILE_NAME__")`,
        meta_data_designer: "me",
        meta_data_license_terms: "CC BY https://creativecommons.org/licenses/by/4.0/",
        meta_data_rating: "",
        meta_data_title: "__BASE_FILE_NAME__ - __PARAMETER_SET__",
      },
      optionPdf: {
        paper_size: "a4",
        orientation: "portrait",
        show_filename: "false",
        show_scale: "true",
        show_scale_message: "true",
        show_grid: "false",
        grid_size: 10.0,
        add_meta_data: "true",
        meta_data_title: "__BASE_FILE_NAME__ - __PARAMETER_SET__",
        meta_data_author: "me",
        meta_data_subject: `__BASE_FILE_NAME__ - __PARAMETER_SET__ (made with OpenSCAD from "file __FILE_NAME__")`,
        meta_data_keywords: "OpenSCAD, 2D model",
        fill: "false",
        fill_color: "black",
        stroke: "true",
        stroke_color: "black",
        stroke_width: 0.35,
      },
      optionSvg: {
        fill: "false",
        fill_color: "white",
        stroke: "true",
        stroke_color: "black",
        stroke_width: 0.35,
      },
      experimentalFeatures: {
        import_function: true, // if enable import() reuturns the data
        lazy_union: true, // useful if you want to export mutilple models in a 3mf file (and mutiple colors)
        predictible_output: true,
        roof: true,
        textmetrics: true,
        object_function: true,
        input_driver_dbus: false,
        vertex_object_renderers_indexing: false,
        python_engine: false,
      },
    },
  };
}

export async function loadConfig(configPath: string): Promise<RecursivePartial<GenerateOptions>> {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }
  const configContent = fs.readFileSync(configPath, "utf-8");
  return yaml.load(configContent) as RecursivePartial<GenerateOptions>;
}
