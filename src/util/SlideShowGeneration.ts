import { Executor } from "openscad-cli-wrapper";
import path from "node:path";
import { GenerateOptions } from "../types.js";
import chalk from "chalk";

export async function GenerateSlideShow(
  images: string[],
  genOptions: GenerateOptions,
  executor: Executor,
): Promise<string> {
  console.log(chalk.green(`➡️ Generating slide show in ${genOptions.generateSlideShow} format for files: ${images}`));
  let ret: string;
  if (genOptions.generateSlideShow === "webp") {
    ret = await GenerateWebpSlideShow(images, genOptions, executor);
  } else {
    ret = await GenerateGifSlideShow(images, genOptions, executor);
  }
  console.log(chalk.green(`✅ Success generating slide show`));
  return ret;
}

async function GenerateWebpSlideShow(
  images: string[],
  genOptions: GenerateOptions,
  executor: Executor,
): Promise<string> {
  const debugCmd = genOptions.openScadOptions.debug ? "-v" : "";
  const escapedImages = images.map((img) => `'${img}'`).join(" ");
  const slideShowFile = `${genOptions.outputDir}/slideShow_${path.parse(genOptions.fileName).name}.webp`;
  return await executor(
    `img2webp ${debugCmd} -o '${slideShowFile}' -d '${genOptions.slideShowInterval}' ${escapedImages}`,
  );
}

async function GenerateGifSlideShow(
  images: string[],
  genOptions: GenerateOptions,
  executor: Executor,
): Promise<string> {
  const debugCmd = genOptions.openScadOptions.debug ? "-verbose" : "";
  const escapedImages = images.map((img) => `'${img}'`).join(" ");
  const slideShowFile = `${genOptions.outputDir}/slideShow_${path.parse(genOptions.fileName).name}.gif`;
  return await executor(
    `convert ${debugCmd} -delay '${genOptions.slideShowInterval * 10}' -loop 0 ${escapedImages} '${slideShowFile}'`,
  );
}
