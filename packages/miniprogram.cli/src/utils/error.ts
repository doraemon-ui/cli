import chalk from 'chalk'

export function error (msg: string) {
  console.log(chalk.red(`[dora error]: ${msg}`))
}
