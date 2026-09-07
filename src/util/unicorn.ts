import chalk from "chalk";

/**
 * Returns a string with the unicorn ASCII art and the text passed as argument.
 * \
 *  \ji
 *  /.(((
 * (,/"(((__,--.
 *     \  ) _( /{
 *     !|| " :||
 *     !||   :||
 *     '''   '''
 * Bonjour monde!
 * @param text
 */
export function unicorn(text: string = "") {
  const unicorn = `\\
 \\ji
 /.(((
(,/"(((__,--.
    \\  ) _( /{
    !|| " :||
    !||   :||
    '''   ''' `;
  return `${chalk.magenta(unicorn)}\n${chalkRainbow(text)}`;
}

export async function unicornWait(sec: number) {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  console.log(unicorn(`Waiting ... ${sec}s`));
  await delay(sec * 1000);
  console.log(unicorn("Bye bye!"));
}

function chalkRainbow(str: string) {
  const letters = str.split("");
  const colors: ("red" | "yellow" | "green" | "cyan" | "blue" | "magenta")[] = [
    "red",
    "yellow",
    "green",
    "cyan",
    "blue",
    "magenta",
  ];
  const colorsCount = colors.length;

  return letters
    .map((l, i) => {
      const color = colors[i % colorsCount];
      return chalk[color](l);
    })
    .join("");
}
