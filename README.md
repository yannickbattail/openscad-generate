# openscad-generate

nodejs script to generate 3D models and images from OpenSCAD files.

It generates for all the presets:

- png image
- webp (or gif) animation
- 3mf 3D model
- add thumbnail to the 3mf model and source code
- mosaic of all the presets
- generate a slide show of all presets in webp (or gif)

More formats can be use: stl,asciistl,binstl,off,wrl,amf,3mf,pov,dxf,svg,pdf,png,gif,webp

```bash
npx openscad-generate@latest generate --outFormats png,webp,3mf --configFile ${baseFile}.yaml ./${baseFile}.scad
```

Add the option `--mosaicFormat 2,2` to generate a mosaic 2 rows, 2 lines.

You can use the option `--parallelJobs 7` to generate in parallel. (optimal number is your CPU number of cores minus

## Usage

run the command `init` to generate a skeleton for your project.

```bash
npx openscad-generate@latest init --add-generate-script true ./example.scad
chmod +x generate_example.sh
```

if will generate the following files:

- `example.scad` a working example file of openscad file
- `example.json` a preset file with 3 presets
- `example.yaml` the configuration file for openscad-generate
- `example.md` a README (replace the '???')
- `generate_example.sh` generation script
- `.gitignore` gitignore file to ignore the generated folder 'gen'

now you can run the script to generate the 3D model, animations and images.

```bash
./generate_example.sh
```

## Required Software

You need to install nodejs, imagemagick, webp and of course openscad-nightly.

On ubuntu

```bash
sudo apt install nodejs npm imagemagick webp
```

or install nodejs with nvm

Install [openscad-nightly](https://openscad.org/downloads.html#snapshots-linux-distro)

## Development

```bash
npm run build
CLI_DIR=$(pwd)
cd the openscad project
${CLI_DIR}/generate.sh generate --mosaicFormat 4,4 --configFile OPENSCAD_FILE.yaml -j 1 ./OPENSCAD_FILE.scad
${CLI_DIR}/generate.sh init --add-generate-script true ./testing.scad
```
