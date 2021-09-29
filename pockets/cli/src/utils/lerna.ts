import chalk from 'chalk'
import * as path from 'path'
import { spawn } from './spawn'
import { root, IS_WIN32, USE_NPX } from '../config'

const lerna = IS_WIN32 ? 'lerna.cmd' : 'lerna'

/**
 * 执行 lerna 指令
 * @param args lerna 命令参数
 * @param onStartMsg 
 * @param onCloseMsg 
 */
export function runLernaCommand (args: string[] = [], onStartMsg = '', onCloseMsg = ''): Promise<void> {
  let command = lerna

  // 如果装有 npx 则使用 npx 执行
  if (USE_NPX) {
    args.unshift(command)
    command = IS_WIN32 ? 'npx.cmd' : 'npx'
  }

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

/**
 * 获取 lerna 配置信息
 */
export function getLernaConfig () {
  const lernaConfig = require(path.resolve(root, 'lerna.json'))
  return lernaConfig || {}
}
