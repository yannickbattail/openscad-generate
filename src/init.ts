import path from "node:path";
import fs from "node:fs";
import chalk from "chalk";

export function init(openscadFile: string, force: boolean) {
  const filePath = path.parse(openscadFile);
  const filesContent = getFilesContent(filePath.name);
  writeFile(`${filePath.dir || "."}/${filePath.name}.scad`, filesContent.openscad, force);
  writeFile(`${filePath.dir || "."}/${filePath.name}.json`, filesContent.preset, force);
  writeFile(`${filePath.dir || "."}/${filePath.name}.config.json`, filesContent.config, force);
  writeFile(`${filePath.dir || "."}/${filePath.name}.md`, filesContent.readme, force);
}

function writeFile(filePath: string, content: string, force: boolean): void {
  if (fs.existsSync(filePath) && !force) {
    console.warn(chalk.yellow(`File ${filePath} already exists. Use --force to overwrite.`));
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

/* [Animation] */
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
    color("green") rotate([0, 90, 0]) cylinder(d=size/2, h=size * 1.25, center=true);
}

module ball(size) {
    difference() {
        sphere(d=size);
        cylinder(d=size/2, h=size * 1.25, center=true);
        #rotate([90, 0, 0]) cylinder(d=size/2, h=size * 1.25, center=true);
        stick(size);
    }
}`;

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
}`;

  const config = `{
  "outputDir": "./gen",
  "outFormats": [
    "png",
    "webp",
//    "gif",
//    "pdf",
//    "svg",
//    "dxf",
    "3mf",
//    "stl",
//    "asciistl",
//    "binstl",
//    "off",
//    "wrl",
//    "amf",
//    "pov",
  ],
  "mosaicOptions": {
    "geometry": {
      "width": 256,
      "height": 256,
      "border": 2
    },
    "tiles": {
      "width": 2,
      "height": 2
    }
  },
  "openScadOptions": {
    "openScadExecutable": "openscad", // or "openscad-nightly"
    "backend": "Manifold", // "CGAL" (old/slow) or "Manifold" (new/fast)
    "check_parameter_ranges": false,
    "check_parameters": false,
    "hardwarnings": false,
    "debug": null,
    "imageOptions": {
      "colorscheme": "Starnight",//Cornfield,Metallic,Sunset,Starnight,BeforeDawn,Nature,DaylightGem,NocturnalGem,DeepOcean,Solarized,Tomorrow,TomorrowNight,ClearSky,Monotone,
      "imgsize": {
        "height": 1024,
        "width": 1024
      },
      "render": null, // for full geometry evaluation when exporting png
      "preview": null, // [=throwntogether] -for ThrownTogether preview png
      "projection": null, // "o" for ortho or "p" for perspective when exporting png
      "view": null, // "axes" | "crosshairs" | "edges" | "scales"
      "autocenter": false, // adjust camera to look at object's center
    },
    "animOptions": {
      "animDelay": 50, // delay in milliseconds between frames
      "animate": 20, // number of frames
      "colorscheme": "Starnight",//Cornfield,Metallic,Sunset,Starnight,BeforeDawn,Nature,DaylightGem,NocturnalGem,DeepOcean,Solarized,Tomorrow,TomorrowNight,ClearSky,Monotone,
      "imgsize": {
        "height": 100,
        "width": 100
      },
      "render": null, // for full geometry evaluation when exporting png
      "preview": null, // [=throwntogether] -for ThrownTogether preview png
      "projection": null, // "o" for ortho or "p" for perspective when exporting png
      "view": null, // "axes" | "crosshairs" | "edges" | "scales"
      "autocenter": false, // adjust camera to look at object's center
    },
    "option3mf": {
      "color_mode": "model", // "model" | "none" | "selected_only".  Set to "model" useful if you want to export mutilple colors in a 3mf file
      "color": "",
      "material_type": "color", // "color" | "basematerial". Set to "color" useful if you want to export mutilple colors in a 3mf file
      "unit": "millimeter", //  micron, millimeter, centimeter, meter, inch, foot
      "add_meta_data": "true",
      "meta_data_copyright": "me 2025",
      "meta_data_description": "__BASE_FILE_NAME__ - __PARAMETER_SET__ (made with OpenSCAD from 'file __FILE_NAME__')",
      "meta_data_designer": "me",
      "meta_data_license_terms": "CC BY https://creativecommons.org/licenses/by/4.0/",
      "meta_data_rating": "",
      "meta_data_title": "__BASE_FILE_NAME__ - __PARAMETER_SET__"
    },
    "experimentalFeatures": {
      "import_function": true, // if enable import() reuturns the data
      "lazy_union": true, // useful if you want to export mutilple models in a 3mf file (and mutiple colors)
      "predictible_output": true,
      "roof": true,
      "textmetrics": true, // enables textmetrics() and fontmetrics() function
    }
  }
}
`;

  const readme = `# ${baseFile}

${baseFile} sample openscad model inspired from the openscad logo.

## UPDATE

- v1: 1st design

## Customizable variables

- \`part\`: default "all", part to generate: all, ball, stick
- \`size\`: default 50, size of the model
- \`$fn\`: resolution

## Sources

here: https://github.com/.../...

## Generate

Command to generate for all the presets:
- png image
- webp animation
- 3mf 3D model
- mosaic of all the presets

\`\`\`bash
npx openscad-generate generate --outFormats png,webp,3mf --mosaicFormat 2,2 --configFile ${baseFile}.config.json ./${baseFile}.scad
\`\`\`

More formats can be use: stl,asciistl,binstl,off,wrl,amf,3mf,pov,dxf,svg,pdf,png,gif,webp

You can use the option \`--parallelJobs 7\` to generate in parallel. (optimal number is your CPU cores minus 1)

You need nodejs, imagemagick, webp and of course openscad-nightly installed.

## License

license GPL

CC BY https://creativecommons.org/licenses/by/4.0/

## keywords

sample, openscad, 3D model, customizable, customizer
`;

  return {
    openscad,
    preset,
    config,
    readme,
  };
}
