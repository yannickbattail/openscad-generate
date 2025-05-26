import { OpenScadOutputWithSummary } from "openscad-cli-wrapper";

export async function GenerateAnimation(
  output: OpenScadOutputWithSummary,
  animDelay: number,
  execCmd: (cmd: string) => Promise<string>,
): Promise<OpenScadOutputWithSummary> {
  const animImagesPattern = output.file;
  output.file = animImagesPattern
    .replace("*.png", ".webp")
    .replace("_animation", "");
  output.output += await execCmd(
    `img2webp -o "${output.file}" -d "${animDelay}" ${animImagesPattern}`,
  );
  output.output += await execCmd(`rm ${animImagesPattern}`);
  return output;
}
