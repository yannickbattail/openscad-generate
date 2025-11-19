import { Export3dFormat, OpenScad, OpenScadOutputWithSummary, ParameterFileSet } from "openscad-cli-wrapper";
import { ExportAllFormat, GenerateOptions } from "./types.js";
import { gen3mf, genModel } from "./generateFormat.js";

export async function convertInFormat(
  format: ExportAllFormat,
  openscad: OpenScad,
  parameterFileSet: ParameterFileSet,
  options: GenerateOptions,
): Promise<OpenScadOutputWithSummary | null> {
  try {
    if (format === Export3dFormat["3mf"]) {
      return gen3mf(openscad, parameterFileSet, format as Export3dFormat, options, true);
    } else if (Object.values(Export3dFormat).includes(format as Export3dFormat)) {
      return genModel(openscad, parameterFileSet, format as Export3dFormat, options);
    } else {
      throw new Error(`💥 Error unknown format: ${format}`);
    }
  } catch (error) {
    console.error(`💥 Error generating parameter set: ${parameterFileSet.parameterName} in format ${format}`, error);
    return null;
  }
}
