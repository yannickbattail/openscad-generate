import { Command } from "commander";
import { unicorn } from "./util/unicorn.js";
import { allFormats, defaultFormats, ExportAllFormat } from "./types.js";
import { generate } from "./generation.js";

const program = new Command();

program
  .name("string-util")
  .description("CLI to some JavaScript string utilities")
  .version("0.8.0");

program
  .command("generate")
  .description("generate from openscad file")
  .argument("<openscadFile>", "string to split")
  .option(
    "-p, --onlyParameterSet <ParameterSet>",
    "only generate this ParameterSet",
  )
  .option(
    "-o, --outFormats <outFormats>",
    `list of outFormats (separated by coma) to refresh : (${allFormats.join(",")}). If not provided, all will be refreshed.`,
    defaultFormats.join(","),
  )
  .action((openscadFile, options) =>
    generate(
      openscadFile,
      toExportAllFormat(options.outFormats),
      options.onlyParameterSet,
    ),
  );

program
  .command("unicorn")
  .description("unicorn say")
  .argument("<sentence>", "what the unicorn have to say")
  .action((str, _) => console.log(unicorn(str)));

program.parse();

function toExportAllFormat(formats: string): ExportAllFormat[] {
  const values = formats.split(",").map((v) => v.trim());
  const invalid = values.filter((v) => !allFormats.includes(v));
  if (invalid.length) {
    throw new Error(`Invalid formats: ${invalid.join(", ")}`);
  }
  return values as ExportAllFormat[];
}
