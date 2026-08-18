import { exec } from "child_process";

import http from "node:http";
import { AddressInfo } from "node:net";

// The Thingiverse ID of this app for requesting an API key
const THINGIVERSE_CLIENT_ID = "82d74c00f1e3455805ae";

export function getThingiverseToken(thingiverseClientId: string | undefined): void {
  thingiverseClientId = thingiverseClientId || THINGIVERSE_CLIENT_ID;

  const server = http.createServer((req, res) => {
    const token = parseToken(req.url ?? "");
    res.writeHead(200, { "Content-Type": "text/html; charset=UTF-8" });
    res.end(getRedirectionPage());
    if (token) {
      console.info(token);
      server.close();
    }
  });

  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address) {
      throw new Error("Server address is null");
    }
    if (typeof address === "object" && "port" in address) {
      const port = (address as AddressInfo).port;
      // console.error(`Listening on port: ${port}`);
      const url = buildUrl(port, thingiverseClientId);
      console.error(`It will open a browser to the url of thingiverse for authentication.`);
      openBrowser(url);
    } else {
      throw new Error("Server address is not an object");
    }
  });
}

function getRedirectionPage() {
  return `
<html lang="en">
    <body id="body">redirection...</body>
      <script language='JavaScript'>
        let url = window.location.toString();
          if (url.includes('#')) {
          url = url.replace('#', '&');
          window.setTimeout(() => {
              window.location = url;
          }, 1000)
        } else {
          document.getElementById("body").innerHTML = "You can now close this page.";
        }
      </script>
</html>`;
}

function buildUrl(port: number | null, thingiverseClientId: string | undefined) {
  const redirectUrl = `http://127.0.0.1:${port}/callback`;
  return `https://www.thingiverse.com/login/oauth/authorize?client_id=${thingiverseClientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUrl)}`;
}

function openBrowser(url: string) {
  const openCommand = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  exec(`${openCommand} "${url}"`);
}

function parseToken(urlStr: string): string | null {
  const tok = urlStr.match(/access_token=([0-9a-f]+)/);
  if (tok) {
    return tok[1];
  } else {
    return null;
  }
}
