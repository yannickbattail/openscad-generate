# openscad-generate

nodejs script to generate 3D models and images from OpenSCAD files.

It generates for all the presets:

- png image
- webp animation
- 3mf 3D model
- mosaic of all the presets

More formats can be use: stl,asciistl,binstl,off,wrl,amf,3mf,pov,dxf,svg,pdf,png,gif,webp

```bash
npx openscad-generate@latest generate --outFormats png,webp,3mf --configFile ${baseFile}.json5 ./${baseFile}.scad
```

Add the option \`--mosaicFormat 2,2 \` to generate a mosaic 2 rows, 2 lines.

You can use the option \`--parallelJobs 7\` to generate in parallel. (optimal number is your CPU number of cores minus

1.

You need nodejs, imagemagick, webp and of course openscad-nightly installed.
