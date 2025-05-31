import { Executor } from "openscad-cli-wrapper";
import chalk from "chalk";

export type MosaicOptions = {
  scadFileName: string;
  outputPath: string;
  geometry?: {
    width: number;
    height: number;
    border: number;
  };
  tiles?: {
    width: number;
    height: number;
  };
  debug?: boolean;
};

const options: MosaicOptions = {
  scadFileName: "model",
  outputPath: "./gen",
  tiles: {
    width: 2,
    height: 2,
  },
  geometry: {
    width: 256,
    height: 256,
    border: 2,
  },
  debug: false,
};

export async function GenerateMosaic(files: string[], mosaicOptions: MosaicOptions, executor: Executor): Promise<void> {
  Object.assign(options, mosaicOptions);
  const debug = options.debug ? "-verbose" : "";
  const geometry = `${options.geometry?.width}x${options.geometry?.height}+${options.geometry?.border}+${options.geometry?.border}`;
  const tiles = `${options.tiles?.width}x${options.tiles?.height}`;

  console.log(chalk.green(`➡️ Generating mosaic ${options.tiles?.width}x${options.tiles?.height} for files: ${files}`));
  await executor(
    `montage ${debug} -geometry "${geometry}" -tile "${tiles}" "${files.join('" "')}" "${options.outputPath}/mosaic_${options.scadFileName}.jpg"`,
  );
  console.log(chalk.green(`✅ Success generating mosaic`));
}
