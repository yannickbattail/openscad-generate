import path from "node:path";
import fs from "node:fs";
import chalk from "chalk";

export function init(openscadFile: string, force: boolean, addGenerateScript) {
  const filePath = path.parse(openscadFile);
  const filesContent = getFilesContent(filePath.name);
  writeFile(`${filePath.dir || "."}/${filePath.name}.scad`, filesContent.openscad, force);
  writeFile(`${filePath.dir || "."}/${filePath.name}.json`, filesContent.preset, force);
  writeFile(`${filePath.dir || "."}/${filePath.name}.yaml`, filesContent.config, force);
  writeFile(`${filePath.dir || "."}/${filePath.name}.md`, filesContent.readme, force);
  if (addGenerateScript) {
    writeFile(`${filePath.dir || "."}/generate_${filePath.name}.sh`, filesContent.generateScript, force);
    writeFile(`${filePath.dir || "."}/.gitignore`, "gen\n", force);
  }
}

function writeFile(filePath: string, content: string, force: boolean): void {
  if (fs.existsSync(filePath) && !force) {
    console.warn(chalk.yellow(`💥 File ${filePath} already exists, skipped! Use the --force option to overwrite.`));
    return;
  }
  fs.writeFileSync(filePath, content);
  console.log(chalk.green(`✅ File written: ${filePath}`));
}

function getFilesContent(baseFile: string) {
  const openscad = `
// part to generate
part = "ball"; // [all, ball, stick]

// size of the model
size=50; // [10:5:100]

/* [resolution] */
// resolution
$fn=10;

/* [Animation] */
// rotating animation
animation_rotation = false;

/* [Hidden] */
is_animated = animation_rotation;
$vpt = is_animated?[0, 0, 0]:$vpt;
$vpr = is_animated?[60, 0, animation_rotation?(365 * $t):45]:$vpr;  // animation rotate around the object
$vpd = is_animated?200:$vpd;

if (part == "ball") {
  ball(size);
} else if (part == "stick") {
  stick(size);
} else {
  ball(size);
  stick(size);
}

module stick(size) {
  color("green")
    rotate([0, 90, 0])
      cylinder(d=size/2, h=size * 1.25, center=true);
}

module ball(size) {
  difference() {
    sphere(d=size);
    cylinder(d=size/2, h=size * 1.25, center=true);
    #rotate([90, 0, 0]) cylinder(d=size/2, h=size * 1.25, center=true);
    stick(size);
  }
}
`;

  const preset = `{
  "parameterSets": {
    "all_20": {
      "part": "all",
      "size": "20"
    },
    "ball_50": {
      "part": "ball",
      "size": "50"
    },
    "stick_50": {
      "part": "stick",
      "size": "50"
    }
  },
  "fileFormatVersion": "1"
}
`;

  const config = `
outputDir: ./gen
embedThumbnailIn3mf: true
embedSourcesIn3mf: true
outFormats:
  ### image
  - png
  ### animation
  - webp
  ### animation, old low quality
  # - gif
  ### 2D doc, see section optionPdf
  # - pdf
  ### 2D vectorial, see section optionSvg
  # - svg
  ### 2D: Drawing Exchange Format, vectorial
  # - dxf
  ### 3D, compressed format with colors and materials, see section option3mf
  - 3mf
  ### 3D stl, ascii or binary depending on openscad configuration
  # - stl
  ### 3D stl, ascii (text)
  # - asciistl
  ### 3D stl, binary
  # - binstl
  ### 3D: Object File Format
  # - off
  ### 3D: Virtual Reality Modeling Language
  # - wrl
  ### 3D: previous version or 3mf, use 3mf instead if possible
  # - amf
  ### 3: POV-Ray Raytracing Format
  # - pov
mosaicOptions:
  geometry:
    ### dimensions of a tile
    width: 256
    height: 256
    border: 2
  tiles:
    ### number of columns
    width: 2
    ### number of lines
    height: 2
### generate a slide show in webp or git (or null to not generate a slide show)
generateSlideShow: webp
### delay in milliseconds between frames
slideShowInterval: 1000
openScadOptions:
  ### executable location
  openScadExecutable: openscad-nightly # or "openscad"
  ### backend engine: "Manifold" (new/fast) or "CGAL" (old/slow)
  backend: Manifold
  ### configure the parameter range check for builtin modules
  check_parameter_ranges: false
  ### configure the parameter check for user modules and functions
  check_parameters: false
  ### Stop on the first warning
  hardwarnings: false
  ### special debug info - specify 'all' or a set of source file names
  debug: null
  imageOptions:
    ### Cornfield, Metallic, Sunset, Starnight, BeforeDawn, Nature, DaylightGem, NocturnalGem, DeepOcean, Solarized, Tomorrow, TomorrowNight, ClearSky, Monotone
    colorscheme: Starnight
    imgsize:
      height: 1024
      width: 1024
    ### for full geometry evaluation when exporting png
    render: null
    ### [=throwntogether] for ThrownTogether preview png
    preview: null
    ### "o" for ortho or "p" for perspective when exporting png
    projection: "p"
    ### "axes", "crosshairs", "edges", "scales" or null
    view: null
    ### adjust camera to look at object's center
    autocenter: true
    ### adjust camera to fit object
    viewall: true
  animOptions:
    ### delay in milliseconds between frames
    animDelay: 50
    ### number of frames
    animate: 20
    ### Cornfield, Metallic, Sunset, Starnight, BeforeDawn, Nature, DaylightGem, NocturnalGem, DeepOcean, Solarized, Tomorrow, TomorrowNight, ClearSky, Monotone
    colorscheme: Starnight
    imgsize:
      height: 300
      width: 300
    ### for full geometry evaluation when exporting png
    render: null
    ### [=throwntogether] for ThrownTogether preview png
    preview: null
    ### "o" for ortho or "p" for perspective when exporting png
    projection: "p"
    ### "axes", "crosshairs", "edges", "scales" or null
    view: null
    ### adjust camera to look at object's center
    autocenter: false
    ### adjust camera to fit object
    viewall: false
  option3mf:
    ### "model", "none" or "selected_only". Set to "model" useful if you want to export multiple colors in a 3mf file
    color_mode: model
    ### set model's for when color_mode=selected_only
    color: ""
    ### "color" | "basematerial". Set to "color" useful if you want to export multiple colors in a 3mf file
    material_type: color
    ###  micron, millimeter, centimeter, meter, inch, foot
    unit: millimeter
    ### add metadata in the 3mf file
    add_meta_data: "true"
    meta_data_copyright: me 2025
    ### the following variables are replaced by their value when generating the file
    #### __FILE_NAME__: the openscad file name with extension
    #### __BASE_FILE_NAME__: the openscad file name without extension
    #### __PARAMETER_SET__: the parameter set name used to generate the file
    #### __GENERATION_DATE__: date of the generation
    #### __PARAMETERS__: values of the parameter set as a JSON string
    meta_data_title: '__BASE_FILE_NAME__ - __PARAMETER_SET__'
    meta_data_description: '__BASE_FILE_NAME__ - __PARAMETER_SET__ Made with OpenSCAD, generated at __GENERATION_DATE__ from "file __FILE_NAME__" with parameters: __PARAMETERS__'
    meta_data_designer: me
    meta_data_license_terms: 'CC BY https://creativecommons.org/licenses/by/4.0/ GPL https://www.gnu.org/licenses/gpl-3.0.html'
    meta_data_rating: ""
  optionPdf:
    paper_size: "a4"
    orientation: "portrait"
    show_filename: "false"
    show_scale: "true"
    show_scale_message: "true"
    show_grid: "false"
    grid_size: 10.0
    add_meta_data: "true"
    # the variables are replaced by their value when generating the file
    meta_data_title: '__BASE_FILE_NAME__ - __PARAMETER_SET__'
    meta_data_author: "me"
    # the variables are replaced by their value when generating the file
    meta_data_subject: '__BASE_FILE_NAME__ - __PARAMETER_SET__ Made with OpenSCAD, generated at __GENERATION_DATE__ from "file __FILE_NAME__" with parameters: __PARAMETERS__'
    meta_data_keywords: "OpenSCAD, 2D model"
    fill: "false"
    fill_color: "black"
    stroke: "true"
    stroke_color: "black"
    stroke_width: 0.35
  optionSvg:
    fill: "false"
    fill_color: "white"
    stroke: "true"
    stroke_color: "black"
    stroke_width: 0.35
  experimentalFeatures:
    ### Enable import() function returning data instead of geometry.
    import_function: true
    ### useful if you want to export multiple models in a 3mf file (and multiple colors)
    lazy_union: true
    ### Attempt to produce predictible, diffable outputs (e.g. sorting the STL, or remeshing in a determined order)
    predictible_output: true
    ### enables object(), is_object() and has_key() functions https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/Objects
    object_function: true
    ### enable roof()
    roof: true
    ### Enable the textmetrics() and fontmetrics() functions.
    textmetrics: true
`;

  const readme = `# ${baseFile}

Description of ${baseFile} sample openscad model inspired from the openscad logo.

SEARCH FOR ??? AND COMPLETE THE DOC

## UPDATE

- v1: 1st design

## How to print it

Material: PLA, ABS ??? color ???

Parts:
- \`all\`: support Yes/No, rotate 180° color: yellow ???
- \`ball\`: support Yes/No, rotate 0° color: blue ???
- \`stick\`: support Yes/No, rotate 0° color: red ???

Other slicer options
- infill: 20% ???
- vase mode (Spiral): No ???
- ...

## Customizable variables

- \`part\`: default "all", part to generate: all, ball, stick
- \`size\`: default 50, size of the model
- \`$fn\`: resolution

## Sources

Sources available [here](https://github.com/.../...) ???

## Generate

Command to generate for all the presets: png image, webp animation, 3mf 3D model and mosaic of all the presets

\`\`\`bash
npx openscad-generate@latest generate --mosaicFormat 2,2 --configFile ${baseFile}.yaml ./${baseFile}.scad
\`\`\`

You can add the option \`--parallelJobs 7\` before the .scad file to generate in parallel. (optimal number is your CPU number of cores minus 1)

Doc of [openscad-generate](https://github.com/yannickbattail/openscad-generate)

## Other interesting designs

- [something](https://www.thingiverse.com/thing:0000000) ???

## License

[GPL](https://www.gnu.org/licenses/gpl-3.0.html)

[CC BY](https://creativecommons.org/licenses/by/4.0/)

## keywords

openscad, customizable, customizer, ???
`;

  const generateScript = `#!/bin/bash

mosaicLines=2
mosaicColumns=2
parallelJobs=2
if command -v nproc >/dev/null 2>&1; then # check if the command nproc exists
  parallelJobs=$(nproc --ignore=2)
fi
if ! [[ "$parallelJobs" =~ ^[1-9][0-9]*$ ]]; then # Validate that parallelJobs is a positive integer
  parallelJobs=2
fi

echo "use \${parallelJobs} parallel jobs"

npx openscad-generate@latest generate --mosaicFormat \${mosaicColumns},\${mosaicLines} --parallelJobs $parallelJobs --configFile ${baseFile}.yaml ./${baseFile}.scad
status=$?

# Notify user about the result
if command -v notify-send >/dev/null 2>&1; then
  if [ $status -eq 0 ]; then
    notify-send -u normal "openscad-generate" "Generation of ${baseFile} finished successfully."
  else
    notify-send -u critical "openscad-generate" "Generation of ${baseFile} FAILED with exit code $status."
  fi
else
  # Fallback to stdout if notify-send isn't available
  if [ $status -eq 0 ]; then
    echo "[INFO] Generation of ${baseFile} finished successfully."
  else
    echo "[ERROR] Generation of ${baseFile} FAILED with exit code $status." >&2
  fi
fi

exit $status

`;

  return {
    openscad,
    preset,
    config,
    readme,
    generateScript,
  };
}
