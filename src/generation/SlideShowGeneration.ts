import { CommandReturn, Executor } from "openscad-cli-wrapper";
import path from "node:path";
import { GenerateOptions } from "../types.js";
import { CoolLog } from "../util/CoolLog.js";

export async function GenerateSlideShow(
  images: string[],
  genOptions: GenerateOptions,
  executor: Executor,
): Promise<{
  code: number | null;
  stdout: string;
  stderr: string;
}> {
  CoolLog.start(`Generating slide show in ${genOptions.generateSlideShow} format for files: ${images}`);
  let ret: {
    code: number | null;
    stdout: string;
    stderr: string;
  };
  if (genOptions.generateSlideShow === "webp") {
    ret = await GenerateWebpSlideShow(images, genOptions, executor);
  } else {
    ret = await GenerateGifSlideShow(images, genOptions, executor);
  }
  if (ret.code === 0) {
    CoolLog.success(`Success generating slide show`);
  } else {
    CoolLog.oups(`Error when generating slide show`, ret.stdout + " " + ret.stderr);
  }
  return ret;
}

async function GenerateWebpSlideShow(
  images: string[],
  genOptions: GenerateOptions,
  executor: Executor,
): Promise<CommandReturn> {
  const slideShowFile = `${genOptions.outputDir}/slideShow_${path.parse(genOptions.fileName).name}.webp`;
  return await executor([
    `img2webp`,
    ...(genOptions.openScadOptions.debug ? ["-v"] : []),
    ...[`-o`, slideShowFile],
    ...[`-d`, genOptions.slideShowInterval.toString()],
    ...images,
  ]);
}

async function GenerateGifSlideShow(
  images: string[],
  genOptions: GenerateOptions,
  executor: Executor,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const slideShowFile = `${genOptions.outputDir}/slideShow_${path.parse(genOptions.fileName).name}.gif`;
  return await executor([
    `convert`,
    ...(genOptions.openScadOptions.debug ? ["-verbose"] : []),
    ...[`-delay`, (genOptions.slideShowInterval * 10).toString()],
    ...[`-loop`, "0"],
    ...images,
    slideShowFile,
  ]);
}
