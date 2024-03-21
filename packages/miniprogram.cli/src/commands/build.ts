import { Options } from '../options'
import { PluginAPI } from '../PluginAPI'

export default function build (api: PluginAPI, options: Options) {
  api.registerCommand('build', {
    description: 'build for production',
    usage: 'dora build [options]',
    options: {
      '--mode': 'specify env mode (default: production)',
      '--watch': 'watch for changes',
    },
  }, async (args, rawArgs) => {
    const { gulp4Build } = require('@doraemon-ui/miniprogram.tools')
    return gulp4Build({
      _: args.watch ? ['watch'] : ['build'],
      onStartMsg: args.watch ? '正在监听文件改变' : '正在构建当前组件',
      onCloseMsg: '构建完成惹',
    })
  })
}

export const defaultModes = {
  build: 'production',
}
