import { Executor } from "openscad-cli-wrapper";
import chalk from "chalk";
import { GenerateOptions } from "../types.js";
import path from "node:path";

export async function GenerateMosaic(files: string[], genOptions: GenerateOptions, executor: Executor): Promise<void> {
  const debug = genOptions.openScadOptions.debug ? "-verbose" : "";
  const geometry = `${genOptions.mosaicOptions.geometry?.width}x${genOptions.mosaicOptions.geometry?.height}+${genOptions.mosaicOptions.geometry?.border}+${genOptions.mosaicOptions.geometry?.border}`;
  const tiles = `${genOptions.mosaicOptions.tiles?.width}x${genOptions.mosaicOptions.tiles?.height}`;
  const mosaicFile = `${genOptions.outputDir}/mosaic_${path.parse(genOptions.fileName).name}.jpg`;
  console.log(
    chalk.green(
      `➡️ Generating mosaic ${genOptions.mosaicOptions.tiles?.width}x${genOptions.mosaicOptions.tiles?.height} for files: ${files}`,
    ),
  );
  await executor(`montage ${debug} -geometry "${geometry}" -tile "${tiles}" "${files.join('" "')}" "${mosaicFile}"`);
  console.log(chalk.green(`✅ Success generating mosaic`));
}
