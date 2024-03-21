import * as path from 'path'
import * as fs from 'fs'
import { PluginAPI } from './PluginAPI'
import { checkVersion } from './utils/version'
import { error } from './utils/error'
import { version } from './version'
import { defaults, Options } from './options'
import defaultsDeep from 'lodash.defaultsdeep'
import minimist from 'minimist'

/**
 * Dora CLI
 *
 * @export
 * @class Service
 */
export class Service {
  /**
   * 当前工作目录
   *
   * @type {string}
   * @memberof Service
   */
  context: string

  /**
   * CLI 命令集合
   *
   * @type {{ [key: string]: ServiceCommand }}
   * @memberof Service
   */
  commands: { [key: string]: ServiceCommand } = {}

  /**
   * 是否已初始化服务
   *
   * @type {boolean}
   * @memberof Service
   */
  initialized: boolean = false

  /**
   * 模式
   *
   * @type {string}
   * @memberof Service
   */
  mode: string

  /**
   * 插件集合
   *
   * @type {{
   *     id: string
   *     apply: {
   *       default: ServicePlugin
   *       defaultModes?: ServicePluginMode
   *     }
   *   }[]}
   * @memberof Service
   */
  plugins: {
    id: string
    apply: {
      default: ServicePlugin
      defaultModes?: ServicePluginModes
    }
  }[] = []

  /**
   * 模式集合
   *
   * @type {ServicePluginModes}
   * @memberof Service
   */
  modes: ServicePluginModes = {}

  /**
   * 项目配置
   *
   * @type {Options}
   * @memberof Service
   */
  projectOptions: Options = {}

  /**
   * package.json 所在目录
   *
   * @type {string}
   * @memberof Service
   */
  pkgContext: string

  /**
   * package.json
   *
   * @type {{ [key: string]: any }}
   * @memberof Service
   */
  pkg: { [key: string]: any } = {}

  /**
   * Creates an instance of Service.
   *
   * @param {string} context
   * @memberof Service
   */
  constructor (context: string) {
    this.context = context
    this.pkgContext = context
    this.pkg = this.resolvePkg()
    this.plugins = this.resolvePlugins()
    this.modes = this.plugins.reduce<ServicePluginModes>((modes, { apply: { defaultModes }}) => {
      return Object.assign(modes, defaultModes)
    }, {})
  }

  /**
   * 初始化
   *
   * @param {string} [mode=process.env.DORA_CLI_CONTEXT]
   * @memberof Service
   */
  private init (mode: string = process.env.DORA_CLI_CONTEXT as string) {
    if (this.initialized) {
      return
    }
    this.initialized = true
    this.mode = mode
    // load user config
    const userOptions = this.loadUserOptions()
    this.projectOptions = defaultsDeep(userOptions, defaults())
    this.plugins.forEach(({ id, apply }) => {
      apply.default(new PluginAPI(id, this), this.projectOptions)
    })
  }

  /**
   * 启动服务
   *
   * @param {string} name 当前命令
   * @param {ServiceRunArgs} [args={ _: undefined }]
   * @param {string[]} [rawArgv=[]]
   * @returns
   * @memberof Service
   */
  public async run (name: string, args: ServiceRunArgs = { _: [] }, rawArgv: string[] = []) {
    const mode = args.mode || (name === 'build' && args.watch ? 'development' : this.modes[name])
    this.init(mode)
    args._ = args._ || []
    let command = this.commands[name]
    if (!command && name) {
      error(`command "${name}" does not exist.`)
      process.exit(1)
    }
    if (args.version || args.V) {
      console.log(version)
      return Promise.resolve(true)
    } else if (!command || args.help || args.h) {
      command = this.commands.help
    } else {
      args._.shift()
      rawArgv.shift()
    }
    await checkVersion()
    const { fn } = command
    return fn(args, rawArgv)
  }

  /**
   * 解析 package.json 文件
   *
   * @param {string} [context=this.context]
   * @returns
   * @memberof Service
   */
  private resolvePkg (context: string = this.context): { [key: string]: any } {
    const packageJSONPath = path.join(context, 'package.json')
    if (fs.existsSync(packageJSONPath)) {
      const pgk = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'))
      return pgk
    } else {
      return {}
    }
  }

  /**
   * 解析插件
   *
   * @returns
   * @memberof Service
   */
  private resolvePlugins () {
    const idToPlugin = (id: string) => ({
      id: id.replace(/^.\//, 'built-in:'),
      apply: require(id),
    })
    const builtInPlugins = [
      './commands/build',
      './commands/create',
      './commands/help',
      './commands/install',
      './commands/serve',
    ].map(idToPlugin)
    return builtInPlugins
  }

  /**
   * 加载项目配置
   *
   * @returns
   * @memberof Service
   */
  private loadUserOptions () {
    // dora.config.js
    let fileConfig: Options | null = null, resolved: Options
    const configPath = (
      process.env.DORA_CLI_CONFIG_PATH ||
      path.resolve(this.context, 'dora.config.js')
    )
    if (fs.existsSync(configPath)) {
      try {
        fileConfig = require(configPath)

        if (typeof fileConfig === 'function') {
          fileConfig = (fileConfig as Function)()
        }

        if (!fileConfig || typeof fileConfig !== 'object') {
          error(
            'Error loading dora.config.js: should export an object or a function that returns object.'
          )
          fileConfig = null
        }
      } catch (e) {
        error('Error loading dora.config.js:')
        throw e
      }
    }
    if (fileConfig) {
      resolved = fileConfig
    } else {
      resolved = {}
    }
    return resolved
  }
}

/**
 * CLI 服务对应的命令
 *
 * @export
 * @interface ServiceCommand
 */
export interface ServiceCommand {
  /** 命令对应的函数 */
  fn: ServiceCommandFn,
  /** 命令对应的参数 */
  opts: ServiceCommandOpts
}

/**
 * 命令对应的参数
 *
 * @export
 * @interface ServiceCommandOpts
 */
export interface ServiceCommandOpts {
  /**
   * Command description.
   *
   * @type {string}
   */
  description?: string

  /**
   * Command usage.
   *
   * @type {string}
   */
  usage?: string

  /**
   * Command details.
   *
   * @type {string}
   */
  details?: string

  /**
   * Command options.
   *
   * @type {{
   *     [key: string]: any
   *   }}
   */
  options?: {
    [key: string]: any
  }
}

/**
 * 命令对应的函数
 *
 * @export
 */
export type ServiceCommandFn = (
  args: ServiceRunArgs,
  rawArgs: string[]
) => void | Promise<any>

/**
 * CLI 服务启动的参数
 *
 * @export
 * @interface ServiceRunArgs
 * @extends {minimist.ParsedArgs}
 */
export interface ServiceRunArgs extends minimist.ParsedArgs {
  /** 模式 */
  mode?: any
  /** 监听 */
  watch?: any
  /** 版本 */
  version?: any
  /** 版本, 缩写 */
  V?: any
  /** 帮助 */
  help?: any
  /** 帮助, 缩写 */
  h?: any
}

/**
 * 插件对应的函数
 *
 * @export
 */
export type ServicePlugin = (
  api: PluginAPI,
  options: Options
) => void

/**
 * 插件对应的模式
 *
 * @export
 * @interface ServicePluginModes
 */
export interface ServicePluginModes {
  [key: string]: string
}