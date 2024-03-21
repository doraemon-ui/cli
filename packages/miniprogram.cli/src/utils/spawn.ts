import * as childProcess from 'child_process'

/**
 * 以 Spawn 方式运行外部程序.
 *
 * @param {ISpawnParam} param
 */
function spawn (param: ISpawnParam) {
  const options = param.options || {}
  let exec: childProcess.ChildProcess

  if (param.useStdIn) {
    // https://nodejs.org/dist/latest-v8.x/docs/api/child_process.html#child_process_options_stdio
    Object.assign(options, {
      stdio: 'inherit',
    })

    exec = childProcess.spawn(param.command, param.args || [], options)
  } else {
    exec = childProcess.spawn(param.command, param.args || [], options)
    if (exec && exec.stdout && exec.stderr) {
      exec.stdout.pipe(process.stdout)

      exec.stderr.on('data', (data: Buffer | string) => {
        data = data.toString()
        typeof param.onData === 'function' && param.onData(data)
      })
    }
  }

  exec.on('close', (code: number) => {
    typeof param.onClose === 'function' && param.onClose(code)
  })

  exec.on('error', error => {
    typeof param.onError === 'function' && param.onError(error)
  })
}

export {
  spawn,
}

interface ISpawnParam {
  command: string
  args?: string[]
  options?: {}
  onData?: (data: string | Buffer) => void
  onClose?: (code: number) => void
  onError?: (error: Error) => void

  /**
   * 启用 StdIn 功能.
   * 传输父进程 StdIn 至子进程, 等同于 options.stdio = 'inherit'
   *
   * @type {boolean}
   * @memberof ISpawnParam
   */
  useStdIn?: boolean
}
