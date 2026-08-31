import { Executor } from "openscad-cli-wrapper";
import { GenerateOptions } from "../types.js";
import path from "node:path";
import { CoolLog } from "../util/CoolLog.js";

export async function GenerateMosaic(files: string[], genOptions: GenerateOptions, executor: Executor): Promise<void> {
  const debug = genOptions.openScadOptions.debug ? "-verbose" : "";
  const geometry = `${genOptions.mosaicOptions.geometry?.width}x${genOptions.mosaicOptions.geometry?.height}+${genOptions.mosaicOptions.geometry?.border}+${genOptions.mosaicOptions.geometry?.border}`;
  const tiles = `${genOptions.mosaicOptions.tiles?.width}x${genOptions.mosaicOptions.tiles?.height}`;
  const mosaicFile = `${genOptions.outputDir}/mosaic_${path.parse(genOptions.fileName).name}.jpg`;
  CoolLog.start(
    `Generating mosaic ${genOptions.mosaicOptions.tiles?.width}x${genOptions.mosaicOptions.tiles?.height} for files: ${files}`,
  );
  const escapedFiles = files.map((img) => `'${img}'`).join(" ");
  await executor(`montage ${debug} -geometry '${geometry}' -tile '${tiles}' ${escapedFiles} '${mosaicFile}'`);
  CoolLog.success(`Success generating mosaic`);
}
