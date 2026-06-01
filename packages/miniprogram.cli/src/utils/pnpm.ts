import chalk from 'chalk'
import { spawn } from './spawn'
import { root, IS_WIN32 } from '../config'

const pnpm = IS_WIN32 ? 'pnpm.cmd' : 'pnpm'

export function runPnpmCommand(args: string[] = [], onStartMsg = '', onCloseMsg = ''): Promise<void> {
  console.log(chalk.gray('Running '), chalk.inverse(`${pnpm} ${args.join(' ')}`))
  console.log(chalk.green(onStartMsg))

  return new Promise((resolve, reject) => {
    spawn({
      useStdIn: true,
      command: pnpm,
      args,
      options: {
        cwd: root,
      },
      onError(err) {
        console.log(chalk.red(err.message))
        reject(err)
      },
      onClose() {
        console.log(chalk.green(onCloseMsg))
        resolve()
      },
    })
  })
}
