import { execSync } from "child_process";
import chalk from "chalk";

export type Stdio = "pipe" | "stdout";

export function createFctExecCommand(
  quietMode: boolean,
  showCommand = false,
): (command: string) => string {
  return function (command: string) {
    return (
      execCommand(
        command,
        {
          stdio: quietMode ? "pipe" : "stdout",
          allowFailure: false,
          quietMode: quietMode,
        },
        showCommand,
      ) ?? ""
    );
  };
}

/**
 * Executes a shell command synchronously and provides options for customization.
 *
 * @param command - The shell command to execute.
 * @param options - Optional configuration for the command execution.
 * @param options.cwd - The working directory to execute the command in. Defaults to the current working directory.
 * @param options.stdio - The stdio configuration for the command. Can be 'pipe' or default to inherit standard streams.
 * @param options.allowFailure - If true, suppresses errors and allows the command to fail without throwing. Defaults to false.
 * @param options.quietMode - If true and `stdio` is set to 'pipe', suppresses the output of the command. Defaults to false.
 * @param showCommand log the command being executed to the console. Defaults to false.
 * @returns The output of the command as a string if `stdio` is set to 'pipe', otherwise undefined.
 * @throws An error if the command fails and `allowFailure` is set to false.
 */
export function execCommand(
  command: string,
  {
    cwd,
    stdio,
    allowFailure = false,
    quietMode = false,
  }: {
    cwd?: string;
    stdio?: Stdio;
    allowFailure?: boolean;
    quietMode?: boolean;
  } = {},
  showCommand = false,
) {
  try {
    if (showCommand) {
      console.log(chalk.blue(`$ ${command}`));
    }
    const output = execSync(command, {
      cwd,
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
      stdio:
        stdio === "pipe"
          ? ["ignore", "pipe", "pipe"]
          : ["ignore", process.stdout, process.stderr],
    });
    if (stdio === "pipe" && !quietMode) {
      console.log(`CMD output: ${output}`);
    }

    return output;
  } catch (e) {
    if (allowFailure) {
      console.warn(
        chalk.yellow(
          e && typeof e === "object" && "message" in e ? e.message : e,
        ),
      );
      return;
    }
    throw e;
  }
}
