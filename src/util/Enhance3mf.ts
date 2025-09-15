import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { ParameterFileSet } from "openscad-cli-wrapper";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

export class Enhance3mf {
  private zip3mf: AdmZip;
  readonly dirInZip = "/Metadata/";
  readonly relsFileName = "_rels/.rels";

  constructor(private pathTo3mfFile: string) {
    this.zip3mf = new AdmZip(this.pathTo3mfFile);
  }

  public save() {
    this.zip3mf.writeZip(this.pathTo3mfFile);
  }

  public addThumbnail() {
    const pngFile = this.pathTo3mfFile.replace(".3mf", ".png");
    this.addFile(pngFile);
    this.updateRels(pngFile);
  }

  private updateRels(pngFile: string) {
    const relationshipXml = this.zip3mf.getEntry(this.relsFileName)?.getData().toString("utf-8");
    if (!relationshipXml) {
      throw new Error("No rels found");
    }
    const xmlOpts = { ignoreAttributes: false, attributeNamePrefix: "@_" };
    const relationshipObj = new XMLParser(xmlOpts).parse(relationshipXml);
    const pathIn3mf = this.dirInZip + path.parse(pngFile).base;
    const relationshipThumb = {
      "@_Target": pathIn3mf,
      "@_Id": "rel999",
      "@_Type": "http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail",
    };
    relationshipObj["Relationships"]["Relationship"] = [
      relationshipObj["Relationships"]["Relationship"],
      relationshipThumb,
    ];
    const xmlContent = new XMLBuilder(xmlOpts).build(relationshipObj);
    this.zip3mf.addFile(this.relsFileName, Buffer.from(xmlContent));
  }

  public addModelFile(modelFile: string) {
    this.addFile(modelFile);
  }

  public addParameterSet(parameterFileSet: ParameterFileSet) {
    this.addFile(parameterFileSet.parameterFile);
  }

  private addFile(filePath: string) {
    const pathIn3mf = this.dirInZip + path.parse(filePath).base;
    this.zip3mf.addFile(pathIn3mf, Buffer.from(fs.readFileSync(filePath)));
  }
}
