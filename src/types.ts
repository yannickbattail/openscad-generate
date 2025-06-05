import { Export2dFormat, Export3dFormat, IOpenScadOptions } from "openscad-cli-wrapper";

export enum GeneratedFormat {
  gif = "gif",
  webp = "webp",
}

export const allFormats: string[] = [
  ...Object.values(Export3dFormat),
  ...Object.values(Export2dFormat),
  ...Object.values(GeneratedFormat),
];

export type ExportAllFormat = Export3dFormat | Export2dFormat | GeneratedFormat;

export const defaultFormats = [Export2dFormat.png, GeneratedFormat.webp, Export3dFormat["3mf"]];

export interface GenerateOptions {
  fileName: string;
  outputDir: string;
  outFormats: ExportAllFormat[];
  onlyParameterSet: string;
  parallelJobs: number;
  generateMosaic: boolean;
  mosaicOptions: MosaicOptions;
  openScadOptions: IOpenScadOptions;
}

export interface MosaicOptions {
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
}
