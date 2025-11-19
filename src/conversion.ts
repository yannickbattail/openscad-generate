import * as fs from "node:fs";
import chalk from "chalk";
import pLimit, { LimitFunction } from "p-limit";

import { createFctExecCommand } from "./util/execBash.js";
import { GenerateOptions } from "./types.js";
import { OpenScad, OpenScadOutputWithSummary } from "openscad-cli-wrapper";
import { convertInFormat } from "./convertFormat.js";

export async function convert(genOptions: GenerateOptions) {
  const executor = createFctExecCommand(!genOptions.openScadOptions.debug, !!genOptions.openScadOptions.debug);
  const limiter: LimitFunction = pLimit(genOptions.parallelJobs);
  console.log(chalk.green(`🚀 Converting file: ${genOptions.fileName} in formats: ${genOptions.outFormats}`));
  if (!fs.existsSync(genOptions.outputDir)) {
    fs.mkdirSync(genOptions.outputDir);
  }
  const openscad = new OpenScad(genOptions.fileName, genOptions.outputDir, executor);
  try {
    parameterFileSet;
    const tasks: Promise<OpenScadOutputWithSummary | null>[] = genOptions.outFormats
      .map((format) => limiter(async () => convertInFormat(format, openscad, parameterFileSet, genOptions)))
      .flat();
    const result = await Promise.allSettled(tasks);
    for (const fail of result.filter((r) => r.status === "rejected").map((r) => r.reason)) {
      console.error(chalk.red(`💥 Error Converting`, fail));
    }
  } catch (error) {
    console.error(`💥 Error Converting`, error);
  }
}
