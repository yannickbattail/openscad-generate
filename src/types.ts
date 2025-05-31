import { Export2dFormat, Export3dFormat } from "openscad-cli-wrapper";

export enum GeneratedFormat {
  jpg = "jpg",
  webp = "webp",
}

export const allFormats: string[] = [
  ...Object.values(Export3dFormat),
  ...Object.values(Export2dFormat),
  ...Object.values(GeneratedFormat),
];

export type ExportAllFormat = Export3dFormat | Export2dFormat | GeneratedFormat;

export const defaultFormats = [Export2dFormat.png, GeneratedFormat.webp, Export3dFormat["3mf"]];
