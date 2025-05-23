import { execSync, ExecSyncOptionsWithStringEncoding } from "child_process";

/**
 * Execute Bash commands synchronously
 * @param cmd
 * @param options
 * @returns
 */
export function execBash(
  cmd: string,
  options: ExecSyncOptionsWithStringEncoding & { neverFails: boolean } = {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    neverFails: false,
  },
) {
  try {
    console.debug(`> ${cmd}`);
    return execSync(cmd, {
      encoding: options.encoding,
      maxBuffer: options.maxBuffer,
      stdio: options.stdio,
    });
  } catch (error) {
    if (options.neverFails) {
      console.debug("The command above has been configured to never fail");
      return "";
    }

    throw error;
  }
}

/**
 * Execute Bash commands synchronously and return output
 * @returns
 * @param cmd
 */
export function execOutput(cmd: string): string {
  return execBash(cmd, {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
    stdio: ["ignore", "inherit", "inherit"],
    neverFails: false,
  });
}
