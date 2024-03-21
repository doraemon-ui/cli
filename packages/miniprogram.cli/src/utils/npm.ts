import chalk from 'chalk'
import { spawn } from './spawn'
import { root, IS_WIN32 } from '../config'

const npm = IS_WIN32 ? 'npm.cmd' : 'npm'

/**
 * 执行 npm 指令
 * @param args npm 命令参数
 * @param onStartMsg 
 * @param onCloseMsg 
 */
export function runNpmCommand (args: string[] = [], onStartMsg = '', onCloseMsg = ''): Promise<void> {
  let command = npm

  console.log(
    chalk.gray('Running '),
    chalk.inverse(`${command} ${args.join(' ')}`)
  )
  console.log(chalk.green(onStartMsg))

  return new Promise((resolve, reject) => {
    spawn({
      useStdIn: true,
      command,
      args,
      options: {
        cwd: root,
      },
      onError (err) {
        console.log(chalk.red(err.message))
        reject(err)
      },
      onClose () {
        console.log(chalk.green(onCloseMsg))
        resolve()
      },
    })
  })
}
