import * as path from "path";
import { existsSync, readFileSync, statSync } from "node:fs";
import { ThingData } from "./thingData.js";
import { ThingiverseApi } from "./thingiverseApi.js";
import { parseDocument } from "yaml";
import { readFile, writeFile } from "../configuration/files.js";
import { CoolLog } from "../util/CoolLog.js";

interface LocalFile {
  name: string;
  path: string;
  date?: number;
  thingiverse_id?: number;
}

interface RemoteFile {
  name: string;
  id: number;
  date?: string;
  rank?: string | number;
  [key: string]: unknown;
}

async function thingiverseDeployFiles(
  accessPath: string,
  localFiles: LocalFile[],
  whitelist: LocalFile[] | string,
  thingdata: ThingData,
  api: ThingiverseApi,
): Promise<void> {
  const existingFiles = (await api.getThingFiles(thingdata.thing_id, accessPath)) as RemoteFile[];

  const filesToUpload: LocalFile[] = [];
  const filesToDelete: RemoteFile[] = [];

  for (const localfile of localFiles) {
    let uploadRequired = true;
    for (const remotefile of existingFiles ?? []) {
      if (remotefile.name === localfile.name) {
        uploadRequired = false;

        if (accessPath === "/files") {
          const naiveUploadTimestamp = new Date(remotefile.date! + "Z");
          const uploadTimestamp = naiveUploadTimestamp.getTime() / 1000;
          if (localfile.date! > uploadTimestamp) {
            CoolLog.debug(`Replacing file ${remotefile.name}`);
            filesToDelete.push(remotefile);
            filesToUpload.push(localfile);
          } else {
            CoolLog.debug(`Keeping uploaded version ${remotefile.name}`);
          }
        }
        break;
      }
    }
    if (uploadRequired) {
      filesToUpload.push(localfile);
    }
  }

  for (const remotefile of existingFiles) {
    let deletionRequired = true;

    for (const localfile of localFiles) {
      if (remotefile.name === localfile.name) {
        deletionRequired = false;
        break;
      }
    }

    if (accessPath === "/images" && Array.isArray(whitelist)) {
      for (const whitelistfile of whitelist) {
        const ext = path.extname(whitelistfile.name);
        const baseName = whitelistfile.name.slice(0, whitelistfile.name.length - ext.length);
        if (remotefile.name === baseName + ".png") {
          deletionRequired = false;
          break;
        }
      }
    }
    if (deletionRequired) {
      filesToDelete.push(remotefile);
    }
  }

  for (const file of filesToDelete) {
    CoolLog.debug(`Deleting file ${file.name}`);
    await api.deleteThingFile(thingdata.thing_id, accessPath, file.id);
  }

  for (const file of filesToUpload) {
    CoolLog.start(`Starting upload of ${file.name}`);

    const uploadCreds = await api.createFileUpload(thingdata.thing_id, file.name);

    const formData = new FormData();
    const fields = uploadCreds.fields as Record<string, string>;
    for (const [key, value] of Object.entries(fields)) {
      if (key !== "success_action_redirect") {
        formData.append(key, value);
      }
    }
    const fileBuffer = readFileSync(file.path);
    formData.append("file", new Blob([fileBuffer]), file.name);

    await api.uploadFileStorage(formData);

    await api.finalizeUpload(fields.success_action_redirect);

    CoolLog.success(`Upload of ${file.name} finished.`);
  }
}

async function thingiverseSetImageOrder(
  imgfiles: LocalFile[],
  thingdata: ThingData,
  api: ThingiverseApi,
): Promise<void> {
  const existingImages = (await api.getThingImages(thingdata.thing_id)) as RemoteFile[];

  for (const remoteImage of existingImages) {
    const index = imgfiles.findIndex(
      (f) => remoteImage.name === f.name || remoteImage.name === path.parse(f.name).name + ".png",
    );
    remoteImage.rank = index >= 0 ? index : 100 + existingImages.indexOf(remoteImage);

    await api.patchImageRank(thingdata.thing_id, remoteImage.id, remoteImage.rank);
  }
}

async function thingiversePublishProject(thingdata: ThingData, api: ThingiverseApi): Promise<void> {
  await api.publishThing(thingdata.thing_id);
  CoolLog.info("Thing published");
}

function toLocalFiles(filePaths: string[], withDate: boolean): LocalFile[] {
  return filePaths.map((filePath) => ({
    name: path.basename(filePath),
    path: filePath,
    ...(withDate ? { date: statSync(filePath).mtimeMs / 1000 } : { thingiverse_id: 0 }),
  }));
}

function checkThingData(thingdata: ThingData) {
  const errors: string[] = [];
  if (!thingdata.name.trim()) {
    errors.push("Thing name is empty");
  }
  if (!thingdata.description.trim()) {
    errors.push("Thing description is empty");
  }
  if (!thingdata.creator.trim()) {
    errors.push("Thing creator is empty");
  }
  if (!thingdata.license.trim()) {
    errors.push("Thing license is empty");
  }
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }
}

function getDescrption(readmeFile: string): string | undefined {
  if (existsSync(readmeFile)) {
    const description = readFileSync(readmeFile, "utf-8");
    if (description.length > 1) {
      CoolLog.debug(`Using description from ${readmeFile}`);
      return description;
    }
  }
}

export async function deployProject(openscadFile: string, thingData: ThingData): Promise<void> {
  const filePath = path.parse(openscadFile);

  thingData.description =
    getDescrption(`${filePath.dir || "."}/${filePath.name}.md`) ??
    getDescrption(`${filePath.dir || "."}/README.md`) ??
    thingData.description;

  checkThingData(thingData);
  const apiToken = process.env.THINGIVERSE_TOKEN;
  if (apiToken) {
    await deployThingiverse(
      new ThingiverseApi(apiToken),
      thingData,
      openscadFile,
      toLocalFiles(thingData.files, true),
      toLocalFiles(thingData.images, false),
    );
  } else {
    throw new Error("No API token provided");
  }
}

async function deployThingiverse(
  api: ThingiverseApi,
  thingData: ThingData,
  openscadFile: string,
  modelFiles: LocalFile[],
  imgFiles: LocalFile[],
): Promise<void> {
  const filePath = path.parse(openscadFile);
  let mode: "create" | "patch";
  let thing: Record<string, unknown>;

  if (thingData.thing_id !== "") {
    thing = await api.getThing(thingData.thing_id);

    if ("error" in thing) {
      if (thing.error === "Unauthorized") {
        CoolLog.oups("Unauthorized, is your API key correct? Exiting");
        process.exit(77); // EX_NOPERM
      }
      if (thing.error === "Not Found") {
        CoolLog.oups("Thing ID specified but Thing not found, exiting");
        process.exit(64);
      }
    }

    const creator = thing.creator as Record<string, unknown>;
    if (thingData.creator === creator.name) {
      mode = "patch";
      CoolLog.debug("Thing already exists, running in patch mode");
    } else {
      CoolLog.oups("Thing ID specified in thingdata.json does not belong to creator, exiting");
      process.exit(77);
    }
  } else {
    mode = "create";
    CoolLog.debug("No thing ID provided, running in creation mode");
  }

  if (mode! === "create") {
    CoolLog.debug("Creating thing");

    const params = {
      name: thingData.name,
      description: thingData.description,
      instructions: thingData.instructions,
      tags: thingData.tags,
      category: thingData.category,
      license: thingData.license,
      is_customizer: thingData.is_customizer,
      is_wip: thingData.is_wip,
      ancestors: thingData.ancestors,
      is_remix: thingData.is_remix,
    };

    thing = await api.createThing(params);

    if (thing.id !== "") {
      CoolLog.info(`Thing creation successful, thing ID: ${thing.id}`);
      saveNewThingId(thing.id, filePath);
    }
  } else if (mode! === "patch") {
    CoolLog.debug("Patching thing");

    const params = {
      name: thingData.name,
      description: thingData.description,
      instructions: thingData.instructions,
      tags: thingData.tags,
      category: thingData.category,
      license: thingData.license,
      is_customizer: thingData.is_customizer,
      is_wip: thingData.is_wip,
      ancestors: thingData.ancestors,
      is_remix: thingData.is_remix,
    };

    await api.patchThing(thingData.thing_id, params);

    CoolLog.debug("Waiting for Thingiverse to refresh tags in response");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    thing = await api.getThingAfterPatch(thingData.thing_id);

    if (thing.id === thingData.thing_id) {
      CoolLog.debug("Thing patching successful");
    }
  }

  CoolLog.debug("Deploying model files:");
  await thingiverseDeployFiles("/files", modelFiles, "whitelist", thingData, api);

  CoolLog.debug("Deploying images:");
  await thingiverseDeployFiles("/images", imgFiles, modelFiles, thingData, api);
  await thingiverseSetImageOrder(imgFiles, thingData, api);

  if (thingData.is_published && !thing!.is_published) {
    await thingiversePublishProject(thingData, api);
  }

  const thingUrl = `https://thingiverse.com/thing:${thingData.thing_id}`;
  CoolLog.success(`Success deploying thing ${thingUrl} done!`);
}

function saveNewThingId(id: unknown, filePath: path.ParsedPath) {
  const configurationFilePath = `${filePath.dir || "."}/${filePath.name}.yaml`;
  const doc = parseDocument(readFile(configurationFilePath));
  doc.setIn(["thingiverse", "thing_id"], id);
  doc.setIn(["thingiverse", "is_published"], true);
  writeFile(configurationFilePath, String(doc), true);
}
