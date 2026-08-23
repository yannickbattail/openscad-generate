import * as path from "path";
import { existsSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { ThingData } from "./thingData.js";
import { ThingiverseApi } from "./thingiverseApi.js";
import { parseDocument } from "yaml";
import { readFile, writeFile } from "../configuration/files.js";

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
            console.log(`Replacing file ${remotefile.name}`);
            filesToDelete.push(remotefile);
            filesToUpload.push(localfile);
          } else {
            console.log(`Keeping uploaded version ${remotefile.name}`);
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
    console.log(`Deleting file ${file.name}`);
    await api.deleteThingFile(thingdata.thing_id, accessPath, file.id);
  }

  for (const file of filesToUpload) {
    console.log(`Starting upload of ${file.name}`);

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

    console.log(`Upload of ${file.name} finished.`);
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
  console.log("Thing published");
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
      console.log(`Using description from ${readmeFile}`);
      return description;
    }
  }
}

export async function deployProject(openscadFile: string, thingData: ThingData): Promise<void> {
  console.log(`Deploying project: ${thingData.name}`);
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
  const projectPath = filePath.dir;

  let mode: "create" | "patch";
  let thing: Record<string, unknown>;

  if (thingData.thing_id !== "") {
    thing = await api.getThing(thingData.thing_id);

    if ("error" in thing) {
      if (thing.error === "Unauthorized") {
        console.error("Unauthorized, is your API key correct? Exiting");
        process.exit(77); // EX_NOPERM
      }
      if (thing.error === "Not Found") {
        console.error("Thing ID specified but Thing not found, exiting");
        process.exit(64);
      }
    }

    const creator = thing.creator as Record<string, unknown>;
    if (thingData.creator === creator.name) {
      mode = "patch";
      console.log("Thing already exists, running in patch mode");
    } else {
      console.error("Thing ID specified in thingdata.json does not belong to creator, exiting");
      process.exit(77);
    }
  } else {
    mode = "create";
    console.log("No thing ID provided, running in creation mode");
  }

  if (mode! === "create") {
    console.log("");
    console.log("Creating thing");

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
      console.log(`Thing creation successful, thing ID: ${thing.id}`);
      saveNewThingId(thing.id, filePath);
    }

    console.log("InitialCreation file generated");
  } else if (mode! === "patch") {
    console.log("Patching thing");

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

    console.log("Waiting for Thingiverse to refresh tags in response");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    thing = await api.getThingAfterPatch(thingData.thing_id);

    if (thing.id === thingData.thing_id) {
      console.log("Thing patching successful");
    }

    const initialCreationPath = path.join(projectPath, "InitialCreation");
    if (existsSync(initialCreationPath)) {
      unlinkSync(initialCreationPath);
      console.log("InitialCreation file removed");
    }
  }

  console.log("Deploying model files:");
  await thingiverseDeployFiles("/files", modelFiles, "whitelist", thingData, api);

  console.log("Deploying images:");
  await thingiverseDeployFiles("/images", imgFiles, modelFiles, thingData, api);
  await thingiverseSetImageOrder(imgFiles, thingData, api);

  console.log("Testing if publishing is required");
  if (thingData.is_published && !thing!.is_published) {
    console.log("Publishing thing");
    await thingiversePublishProject(thingData, api);
  } else if (!thingData.is_published) {
    console.log("Publishing not requested");
  } else if (thing!.is_published) {
    console.log("Thing already published");
  }

  const thingUrl = `https://thingiverse.com/thing:${thingData.thing_id}`;
  console.info(`✅ Deploying thing ${thingUrl} done!`);
}
function saveNewThingId(id: unknown, filePath: path.ParsedPath) {
  const configurationFilePath = `${filePath.dir || "."}/${filePath.name}.yaml`;
  const doc = parseDocument(readFile(configurationFilePath));
  doc.setIn(["thingiverse", "thing_id"], id);
  doc.setIn(["thingiverse", "is_published"], true);
  writeFile(configurationFilePath, String(doc), true);
}
