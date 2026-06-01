import { Options } from '../options'
import { PluginAPI } from '../PluginAPI'

export default function build(api: PluginAPI, options: Options) {
  api.registerCommand(
    'build',
    {
      description: 'build for production',
      usage: 'dora build [options]',
      options: {
        '--mode': 'specify env mode (default: production)',
        '--watch': 'watch for changes',
      },
    },
    async (args, rawArgs) => {
      const { buildComponent } = require('@doraemon-ui/miniprogram.tools')
      return buildComponent({
        _: args.watch ? ['watch'] : ['build'],
        onStartMsg: args.watch ? 'Watching for file changes' : 'Building component',
        onCloseMsg: 'Build complete',
      })
    },
  )
}

export const defaultModes = {
  build: 'production',
}
