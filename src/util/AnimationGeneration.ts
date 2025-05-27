import { Executor, OpenScadOutputWithSummary } from "openscad-cli-wrapper";

export async function GenerateAnimation(
  output: OpenScadOutputWithSummary,
  animDelay: number,
  executor: Executor,
): Promise<OpenScadOutputWithSummary> {
  const animImagesPattern = output.file;
  output.file = animImagesPattern.replace("*.png", ".webp").replace("_animation", "");
  output.output += await executor(`img2webp -o "${output.file}" -d "${animDelay}" ${animImagesPattern}`);
  output.output += await executor(`rm ${animImagesPattern}`);
  return output;
}
