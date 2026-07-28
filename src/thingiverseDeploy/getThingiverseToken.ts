import { exec } from "child_process";
import readline from "readline";

// The Thingiverse ID of this app for requesting an API key
const THINGIVERSE_CLIENT_ID = "82d74c00f1e3455805ae";

export function getThingiverseToken(thingiverseClientId: string | undefined): void {
  thingiverseClientId = thingiverseClientId || THINGIVERSE_CLIENT_ID;
  const url =
    "https://www.thingiverse.com/login/oauth/authorize?client_id=" + thingiverseClientId + "&response_type=token";

  const openCommand = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${openCommand} "${url}"`);

  console.error("Opening web browser, please authorize.");
  console.error("After authorizing, copy the response URL from your address bar and paste here:");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  rl.question("Response URL: ", (accessCode: string) => {
    rl.close();

    if (!accessCode.includes("access_token=")) {
      console.error('Invalid response URL, string "access_token=" not found.');
      process.exit(64); // EX_USAGE
    } else {
      const splitCode = accessCode.split("access_token=");

      if (splitCode[1].length > 0) {
        const newApiKey = splitCode[1];
        console.info(newApiKey);
      } else {
        console.error("Invalid response URL, api token empty.");
        process.exit(64);
      }
    }
  });
}
