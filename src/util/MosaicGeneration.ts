import {
  OpenScadOutputWithSummary,
  ParameterFileSet,
} from "openscad-cli-wrapper";

export async function GenerateMosaic(
  parameterFileSet: ParameterFileSet,
  execCmd: (cmd: string) => Promise<string>,
): Promise<OpenScadOutputWithSummary> {
  // montage ${imagemagick_debug} -geometry "${image_mosaic_geometry}" -tile "${image_mosaic_tile}" "${jpg_dir}/"*.png "${jpg_dir}/mosaic_${scad_file_name}.jpg"
  // let output = execOutput(
  //   `img2webp -o "${output.file}" -d "${animDelay}" ${animImagesPattern}`,
  // );
  // output += execOutput(`rm ${animImagesPattern}`);
  return {
    output: "",
    modelFile: parameterFileSet.parameterFile,
    summary: {
      cache: {
        cgal_cache: {
          bytes: 0,
          entries: 0,
          max_size: 0,
        },
        geometry_cache: {
          bytes: 0,
          entries: 0,
          max_size: 0,
        },
      },
      camera: {
        distance: 0,
        fov: 0,
        rotation: [0, 0, 0],
        translation: [0, 0, 0],
      },
      geometry: {
        bounding_box: {
          max: [0, 0, 0],
          min: [0, 0, 0],
          size: [0, 0, 0],
        },
        dimensions: 0,
        facets: 0,
        simple: false,
        vertices: 0,
      },
      time: {
        hours: 0,
        milliseconds: 0,
        minutes: 0,
        seconds: 0,
        time: "",
        total: 0,
      },
    },
    file: "",
  };
}
