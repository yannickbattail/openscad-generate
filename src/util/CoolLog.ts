import chalk from "chalk";

export class CoolLog {
  static log(message: string, obj?: unknown) {
    console.log(message, obj);
  }
  static debug(message: string, obj?: unknown) {
    console.debug(chalk.magenta(`🐞 ${message}`), obj);
  }
  static success(message: string, obj?: unknown) {
    if (obj !== undefined) {
      console.log(chalk.green(`✅ ${message}`), obj);
    } else {
      console.log(chalk.green(`✅ ${message}`));
    }
  }
  static start(message: string, obj?: unknown) {
    if (obj !== undefined) {
      console.log(chalk.cyan(`⇨ ${message}`), obj);
    } else {
      console.log(chalk.cyan(`⇨ ${message}`));
    }
  }
  static info(message: string, obj?: unknown) {
    if (obj !== undefined) {
      console.log(chalk.gray(`⚪ ${message}`), obj);
    } else {
      console.log(chalk.gray(`⚪ ${message}`));
    }
  }
  static warn(message: string, error?: unknown) {
    if (error !== undefined) {
      console.warn(chalk.yellow(`⚠️ ${message}`), error);
    } else {
      console.warn(chalk.yellow(`⚠️ ${message}`));
    }
  }
  static oups(message: string, error?: unknown) {
    if (error !== undefined) {
      console.error(chalk.red(`💥 ${message}`), error);
    } else {
      console.error(chalk.red(`💥 ${message}`));
    }
  }
}
