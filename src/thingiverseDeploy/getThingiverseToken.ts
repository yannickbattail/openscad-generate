import { exec } from "child_process";
import readline from "readline";

// The Thingiverse ID of this app for requesting an API key
const THINGIVERSE_CLIENT_ID = process.env.THINGIVERSE_CLIENT_ID || "82d74c00f1e3455805ae";

export function getThingiverseToken(): void {
  console.log("Running in API token request mode");

  const url =
    "https://www.thingiverse.com/login/oauth/authorize?client_id=" + THINGIVERSE_CLIENT_ID + "&response_type=token";

  // Open browser
  const openCommand = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${openCommand} "${url}"`);

  console.log("Opening webbrowser, please authorize.");
  console.log("After authorizing, copy the response URL");
  console.log("from your address bar and paste here:");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
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

        console.log("");
        console.log("Your API key was generated, put it in a safe location");
        console.log("and use it for deploying like --deploy-project=<ApiKey>");
        console.log("");
        console.log("Key: ");
        console.log(newApiKey);
        console.log("");
        console.log("Using this, you can run '--deploy-project-thingiverse <API_KEY>'!");
      } else {
        console.log("Invalid response URL, api token empty.");
        process.exit(64);
      }
    }
  });
}
