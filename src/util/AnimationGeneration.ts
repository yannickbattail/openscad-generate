import { OpenScadOutputWithSummary } from "openscad-cli-wrapper";

export function GenerateAnimation(
  output: OpenScadOutputWithSummary,
  animDelay: number,
  execCmd: (cmd: string) => string,
) {
  const animImagesPattern = output.file;
  output.file = animImagesPattern
    .replace("*.png", ".webp")
    .replace("_animation", "");
  output.output += execCmd(
    `img2webp -o "${output.file}" -d "${animDelay}" ${animImagesPattern}`,
  );
  output.output += execCmd(`rm ${animImagesPattern}`);
  return output;
}
