import { Executor, OpenScadOutputWithSummary } from "openscad-cli-wrapper";

export async function GenerateWebpAnimation(
  output: OpenScadOutputWithSummary,
  animDelay: number,
  executor: Executor,
): Promise<OpenScadOutputWithSummary> {
  const animImagesPattern = output.file;
  output.file = animImagesPattern.replace("*.png", ".webp").replace("_animation", "");
  const debug = ""; // "-v"
  output.output += await executor(`img2webp ${debug} -o "${output.file}" -d "${animDelay * 10}" ${animImagesPattern}`);
  try {
    output.output += await executor(`rm ${animImagesPattern}`);
  } catch (error) {
    console.log(`Error cleaning anim images (${animImagesPattern})`, error);
  }
  return output;
}

export async function GenerateGifAnimation(
  output: OpenScadOutputWithSummary,
  animDelay: number,
  executor: Executor,
): Promise<OpenScadOutputWithSummary> {
  const animImagesPattern = output.file;
  output.file = animImagesPattern.replace("*.png", ".gif").replace("_animation", "");
  const debug = ""; // "-verbose"
  output.output += await executor(
    `convert ${debug} -delay "${animDelay}" -loop 0 ${animImagesPattern} "${output.file}"`,
  );
  try {
    output.output += await executor(`rm ${animImagesPattern}`);
  } catch (error) {
    console.log(`Error cleaning anim images (${animImagesPattern})`, error);
  }
  return output;
}
