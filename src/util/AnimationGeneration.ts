import { Executor, OpenScadOutputWithSummary } from "openscad-cli-wrapper";

export async function GenerateWebpAnimation(
  output: OpenScadOutputWithSummary,
  animDelay: number,
  debug: boolean,
  executor: Executor,
): Promise<OpenScadOutputWithSummary> {
  const animImagesPattern = output.file;
  output.file = animImagesPattern.replace("_animImg*.png", ".webp");
  const escapedAnimImagesPattern = animImagesPattern.replaceAll(" ", "\\ ");
  const debugCmd = debug ? "-v" : "";
  output.output += await executor(
    `img2webp ${debugCmd} -o '${output.file}' -d '${animDelay}' ${escapedAnimImagesPattern}`,
  );
  if (!debug) {
    try {
      output.output += await executor(`rm ${escapedAnimImagesPattern}`);
    } catch (error) {
      console.log(`Error cleaning anim images (${animImagesPattern})`, error);
    }
  }
  return output;
}

export async function GenerateGifAnimation(
  output: OpenScadOutputWithSummary,
  animDelay: number,
  debug: boolean,
  executor: Executor,
): Promise<OpenScadOutputWithSummary> {
  const animImagesPattern = output.file;
  output.file = animImagesPattern.replace("_animImg*.png", ".gif");
  const escapedAnimImagesPattern = animImagesPattern.replaceAll(" ", "\\ ");
  const debugCmd = debug ? "-verbose" : "";
  output.output += await executor(
    `convert ${debugCmd} -delay '${animDelay * 10}' -loop 0 ${escapedAnimImagesPattern} '${output.file}'`,
  );
  if (!debug) {
    try {
      output.output += await executor(`rm ${escapedAnimImagesPattern}`);
    } catch (error) {
      console.log(`Error cleaning anim images (${animImagesPattern})`, error);
    }
  }
  return output;
}
