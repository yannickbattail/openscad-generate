import path from "node:path";
import fs from "node:fs";
import { URL } from "node:url";
import { FormData } from "formdata-node";
import { fileFromPath } from "formdata-node/file-from-path";
import fetch from "node-fetch";
import { Thingiverse } from "./thingiverse/Thingiverse.js";

/**
 * Check if the response contains an error
 */
function checkError(response: unknown): void {
  if (response && typeof response === "object" && "error" in response) {
    throw new Error(`API Error: ${response.error}`);
  }
}

/**
 * Upload a file to Thingiverse
 */
async function uploadFile(thingiverse: Thingiverse, thingId: string, filename: string): Promise<void> {
  const basename = path.basename(filename);

  // Get thing and check existence
  const thing = await thingiverse.get_thing(thingId);
  checkError(thing);

  // Get list of already uploaded files
  const onlineFiles = await thingiverse.get_thing_file(thingId, null);

  // Delete online file if it already exists
  for (const ofile of onlineFiles) {
    if (ofile.name === basename) {
      if (ofile.size === fs.statSync(filename).size) {
        console.log(`A file with the same size already exists. [file=${basename}]`);
        return;
      }
      await thingiverse.delete_thing_file(thingId, ofile.id);
      console.log(`Deleted already existing file. [file=${basename}]`);
    }
  }

  // Get upload info from Thingiverse
  const data = JSON.stringify({ filename: basename });
  const uploadInfo = await thingiverse.upload_thing_file(thingId, data);
  console.log(`Got upload data from Thingiverse. [file=${basename}]`);

  // Create form data for S3
  const formData = new FormData();
  for (const [key, value] of Object.entries(uploadInfo.fields)) {
    formData.append(key, value as string);
  }
  formData.append("file", await fileFromPath(filename));

  // Upload file to AWS S3 storage
  const url = uploadInfo.action;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    redirect: "manual",
  });
  console.log(`New file uploaded. [file=${basename}, return=${res.status}]`);

  // Get file id to notify Thingiverse of a new file
  const redirectUrl = res.headers.get("location");
  if (!redirectUrl) {
    throw new Error("No redirect URL found in response");
  }

  const parsedUrl = new URL(redirectUrl);
  const pathParts = parsedUrl.pathname.split("/");
  const fileId = pathParts[2];

  const finalizeRes = await thingiverse.finalize_file(fileId);
  checkError(finalizeRes);
  console.log(`Thingiverse notified of new file. [file=${basename}]`);
}

/**
 * Upload files to Thingiverse
 */
export async function uploadThingiverse(openscadFile: string): Promise<void> {
  const filePath = path.parse(openscadFile);
  const ufile = path.join(filePath.dir, filePath.name + ".json");

  // Check environment variables
  if (!process.env.THINGIVERSE_KEY) {
    console.error("THINGIVERSE_KEY environment variable not set.");
    process.exit(1);
  }
  if (!process.env.THINGIVERSE_SECRET) {
    console.error("THINGIVERSE_SECRET environment variable not set.");
    process.exit(1);
  }
  if (!process.env.THINGIVERSE_TOKEN) {
    console.error("THINGIVERSE_TOKEN environment variable not set.");
    process.exit(1);
  }

  const KEY = process.env.THINGIVERSE_KEY;
  const SECRET = process.env.THINGIVERSE_SECRET;
  const TOKEN = process.env.THINGIVERSE_TOKEN;

  // Check whether the upload definition file exists in the given path
  if (!fs.existsSync(ufile) || !fs.statSync(ufile).isFile()) {
    console.error(`Upload definition file not found. [file=${ufile}]`);
    process.exit(2);
  }

  const basePath = path.dirname(ufile);

  // Open upload definition file
  const uploadData = JSON.parse(fs.readFileSync(ufile, "utf-8"));

  // If thingiverse not defined in file
  if (!uploadData.thingiverse) {
    console.error(`No thingiverse entry in path. [path=${ufile}]`);
    process.exit(3);
  }

  const upload = uploadData.thingiverse;
  const thingId = upload.thing_id;

  // Connect to thingiverse
  console.log(`Connecting to thingiverse. [file=${ufile}]`);
  const t = new Thingiverse({ client_id: KEY, client_secret: SECRET, redirect_uri: "", token: TOKEN });

  for (const f of upload.files) {
    const file = path.join(basePath, f);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      console.error(`Upload definition file not found. [file=${file}]`);
      process.exit(2);
    }
    await uploadFile(t, thingId, file);
  }
}
