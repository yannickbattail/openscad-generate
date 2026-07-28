import * as path from "path";
import { ThingData } from "./thingData.js";
import { GenerateOptions } from "../types.js";
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";

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

interface Headers {
  Authorization: string;
  [key: string]: string;
}

async function httpGet(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...options, method: "GET" });
}

async function httpPost(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...options, method: "POST" });
}

async function httpPatch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...options, method: "PATCH" });
}

async function httpDelete(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...options, method: "DELETE" });
}

async function thingiverseDeployFiles(
  accessPath: string,
  localFiles: LocalFile[],
  whitelist: LocalFile[] | string,
  thingdata: ThingData,
  headers: Headers,
): Promise<void> {
  const existingFilesRes = await httpGet(`https://api.thingiverse.com/things/${thingdata.thing_id}${accessPath}`, {
    headers,
  });
  const existingFiles: RemoteFile[] = await existingFilesRes.json();

  const filesToUpload: LocalFile[] = [];
  const filesToDelete: RemoteFile[] = [];

  for (const localfile of localFiles) {
    let uploadRequired = true;
    for (const remotefile of existingFiles) {
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
    const deletionRes = await httpDelete(
      `https://api.thingiverse.com/things/${thingdata.thing_id}${accessPath}/${file.id}`,
      { headers },
    );
    await deletionRes.json();
  }

  for (const file of filesToUpload) {
    console.log(`Starting upload of ${file.name}`);

    const uploadCredsRes = await httpPost(`https://api.thingiverse.com/things/${thingdata.thing_id}/files`, {
      headers,
      body: JSON.stringify({ filename: file.name }),
    });
    const uploadCreds = await uploadCredsRes.json();

    const formData = new FormData();
    const fields = uploadCreds.fields as Record<string, string>;
    for (const [key, value] of Object.entries(fields)) {
      if (key !== "success_action_redirect") {
        formData.append(key, value);
      }
    }
    const fileBuffer = readFileSync(file.path);
    formData.append("file", new Blob([fileBuffer]), file.name);

    await httpPost("https://www.thingiverse.com/upload_file_storage", {
      body: formData,
      redirect: "manual",
    });

    const finalizeRes = await httpPost(fields.success_action_redirect, {
      headers,
    });
    await finalizeRes.json();

    console.log(`Upload of ${file.name} finished.`);
  }
}

async function thingiverseSetImageOrder(_imgfiles: LocalFile[], thingdata: ThingData, headers: Headers): Promise<void> {
  const existingImagesRes = await httpGet(`https://api.thingiverse.com/things/${thingdata.thing_id}/images`, {
    headers,
  });
  const existingImages: RemoteFile[] = await existingImagesRes.json();

  let numberOfInvalidFilenames = 0;
  for (const remoteImage of existingImages) {
    if (/^[0-9][0-9]-+/.test(remoteImage.name)) {
      remoteImage.rank = remoteImage.name.slice(0, 2);
      //console.log(`Found valid filename: ${remoteImage.name}, Rank: ${remoteImage.rank}`);
    } else {
      remoteImage.rank = 100 + numberOfInvalidFilenames;
      numberOfInvalidFilenames++;
      //console.log(`Not a valid filename for ranking: ${remoteImage.name}, Rank: ${remoteImage.rank}`);
    }

    const params = { rank: remoteImage.rank };
    await httpPatch(`https://api.thingiverse.com/things/${thingdata.thing_id}/images/${remoteImage.id}`, {
      headers,
      body: JSON.stringify(params),
    });
  }
}

async function thingiversePublishProject(thingdata: ThingData, headers: Headers): Promise<void> {
  await httpPost(`https://api.thingiverse.com/things/${thingdata.thing_id}/publish`, { headers });
  console.log("Thing published");
}

function getModelFiles(projectPath: string) {
  const modelFiles: LocalFile[] = [];
  for (const file of readdirSync(projectPath)) {
    if (/\.(FCStd|scad|f3d|json|py)$/.test(file)) {
      const filePath = path.join(projectPath, file);
      modelFiles.push({
        name: file,
        path: filePath,
        date: statSync(filePath).mtimeMs / 1000,
      });
    }
  }

  const genPath = path.join(projectPath, "gen");
  for (const file of readdirSync(genPath)) {
    if (/\.(stl|obj|stp|STEP|3mf)$/.test(file)) {
      const filePath = path.join(genPath, file);
      modelFiles.push({
        name: file,
        path: filePath,
        date: statSync(filePath).mtimeMs / 1000,
      });
    }
  }
  return modelFiles;
}

function getImageFiles(projectPath: string) {
  const imgfiles: LocalFile[] = [];
  const genPath = path.join(projectPath, "gen");
  const photosPath = path.join(projectPath, "photos");
  for (const file of readdirSync(photosPath)) {
    if (/\.(png|jpg|jpeg|bmp|webp)$/.test(file)) {
      imgfiles.push({
        name: file,
        path: path.join(photosPath, file),
        thingiverse_id: 0,
      });
    }
  }
  for (const file of readdirSync(genPath)) {
    if (/\.(png|jpg|webp)$/.test(file)) {
      imgfiles.push({
        name: file,
        path: path.join(genPath, file),
        thingiverse_id: 0,
      });
    }
  }
  return imgfiles;
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

export async function deployProject(openscadFile: string, genOption: GenerateOptions): Promise<void> {
  const thingData: ThingData = genOption.thingiverse;
  console.log(`Deploying project: ${thingData.name}`);
  const filePath = path.parse(openscadFile);
  const projectDir = filePath.dir || ".";

  thingData.description =
    getDescrption(`${filePath.dir || "."}/${filePath.name}.md`) ??
    getDescrption(`${filePath.dir || "."}/README.md`) ??
    thingData.description;

  checkThingData(thingData);
  const apiToken = process.env.THINGIVERSE_TOKEN;
  if (apiToken) {
    await deployThingiverse(apiToken, thingData, openscadFile, getModelFiles(projectDir), getImageFiles(projectDir));
  } else {
    throw new Error("No API token provided");
  }
}

async function deployThingiverse(
  apiToken: string,
  thingData: ThingData,
  openscadFile: string,
  modelFiles: LocalFile[],
  imgFiles: LocalFile[],
): Promise<void> {
  const filePath = path.parse(openscadFile);
  const projectPath = filePath.dir;
  const headers: Headers = { Authorization: "Bearer " + apiToken };

  let mode: "create" | "patch";
  let thing: Record<string, unknown>;

  if (thingData.thing_id !== "") {
    const thingRes = await httpGet(`https://api.thingiverse.com/things/${thingData.thing_id}`, { headers });
    thing = await thingRes.json();

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

    const response = await httpPost("https://api.thingiverse.com/things/", {
      headers,
      body: JSON.stringify(params),
    });
    thing = await response.json();

    writeFileSync(path.join(projectPath, "CreationResponse.json"), JSON.stringify(thing, null, 4), "utf-8");

    const newThingId = thing.id;

    if (newThingId !== "") {
      console.log(`Thing creation successful, thing ID: ${newThingId}`);
    }

    //thingdata.thing_id = newThingId as string | number;
    //fs.writeFileSync(datapath, JSON.stringify(thingdata, null, 4), "utf-8");

    console.log("InitialCreation file generated");
    writeFileSync(path.join(projectPath, "InitialCreation"), "Initial creation success", "utf-8");
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

    await httpPatch(`https://api.thingiverse.com/things/${thingData.thing_id}/`, {
      headers,
      body: JSON.stringify(params),
    });

    console.log("Waiting for Thingiverse to refresh tags in response");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const thingRes = await httpGet(`https://api.thingiverse.com/things/${thingData.thing_id}/`, { headers });
    thing = await thingRes.json();

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
  await thingiverseDeployFiles("/files", modelFiles, "whitelist", thingData, headers);

  console.log("Deploying images:");
  await thingiverseDeployFiles("/images", imgFiles, modelFiles, thingData, headers);
  await thingiverseSetImageOrder(imgFiles, thingData, headers);

  console.log("Testing if publishing is required");
  if (thingData.is_published && !thing!.is_published) {
    console.log("Publishing thing");
    await thingiversePublishProject(thingData, headers);
  } else if (!thingData.is_published) {
    console.log("Publishing not requested");
  } else if (thing!.is_published) {
    console.log("Thing already published");
  }

  const thingUrl = `https://thingiverse.com/thing:${thingData.thing_id}`;
  console.info(`✅ Deploying thing ${thingUrl} done!`);
  writeFileSync(path.join(projectPath, "thingId.txt"), String(thingData.thing_id), "utf-8");
}
