import { Options } from '../../options'
import { PluginAPI } from '../../PluginAPI'
import { ComponentType, NpmScope } from '../../utils/prompt'

export default function create (api: PluginAPI, options: Options) {
  api.registerCommand('create', {
    description: 'create a new component powered by dora',
    usage: 'create <name>',
    options: {
      '--default': 'Skip prompts and use default preset',
    },
  }, async (args, rawArgs) => {
    const type = args.default ? ComponentType.MiniprogramComponent : null
    const npmScope = args.default ? NpmScope.UI : null
    return require('./create').create(api.getCwd(), args._[0], type, npmScope)
  })
}
