# openscad-generate

nodejs script to generate 3D models and images from OpenSCAD files.

It generates for all the presets:

- png image and webp (or gif) animation
- 3mf 3D model
- add thumbnail to the 3mf model and source code
- mosaic of all the presets
- generate a slide show of all presets in webp (or gif)

More formats can be use: stl,asciistl,binstl,off,wrl,amf,3mf,pov,dxf,svg,pdf,png,gif,webp

```bash
npx openscad-generate@latest generate --outFormats png,webp,3mf --configFile OPENSCAD_FILE.yaml OPENSCAD_FILE.scad
```

Add the option `--mosaicFormat 2,2` to generate a mosaic 2 rows, 2 lines.

You can use the option `--parallelJobs 7` to generate in parallel. (optimal number is your CPU number of cores minus

## Usage

### Initialize a new project

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

### Deploy to Thingiverse

run this command and follow the instruction to get a token from thingiverse.

```bash
npx openscad-generate@latest get-thingiverse-token
```

Keep the token for the next command.

Set the section `thingiverse` in a your config file `OPENSCAD_FILE.yaml`

```bash
THINGIVERSE_TOKEN=token_from_previous_command npx openscad-generate@latest deploy-thingiverse --configFile OPENSCAD_FILE.yaml OPENSCAD_FILE.scad
```

## Use in docker

Build the image
```bash
docker build . -t openscad-generate
```
VERSION

Build the image
```bash
docker run -d --name openscad-generate -p 42080:42080 -v ${PWD}:/home/ubuntu/project openscad-generate
```

- `-v ${PWD}:/home/ubuntu/project` mount the current directory to the working directory in the container
- `-p  42080:42080` expose port 42080, only required for thwe command `get-thingiverse-token`

```bash
docker exec -it openscad-generate init --add-generate-script true example.scad
docker exec -it openscad-generate generate --configFile example.yaml example.scad
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
OPENSCAD_BASEFILE=testing

${CLI_DIR}/generate.sh init --add-generate-script true --force true ./${OPENSCAD_BASEFILE}.scad
${CLI_DIR}/generate.sh generate --configFile ${OPENSCAD_BASEFILE}.yaml -j 1 ${OPENSCAD_BASEFILE}.scad
${CLI_DIR}/generate.sh update --add-generate-script true --force true ./${OPENSCAD_BASEFILE}.scad

export THINGIVERSE_CLIENT_ID=82d74c00f1e3455805ae
${CLI_DIR}/generate.sh get-thingiverse-token
export THINGIVERSE_TOKEN=XXXXXXXXXXXX
${CLI_DIR}/generate.sh deploy-thingiverse --configFile ${OPENSCAD_BASEFILE}.yaml ${OPENSCAD_BASEFILE}.scad
```
