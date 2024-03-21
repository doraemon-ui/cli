import { PluginAPI } from './PluginAPI';
import { Options } from './options';
import minimist from 'minimist';
/**
 * Dora CLI
 *
 * @export
 * @class Service
 */
export declare class Service {
    /**
     * 当前工作目录
     *
     * @type {string}
     * @memberof Service
     */
    context: string;
    /**
     * CLI 命令集合
     *
     * @type {{ [key: string]: ServiceCommand }}
     * @memberof Service
     */
    commands: {
        [key: string]: ServiceCommand;
    };
    /**
     * 是否已初始化服务
     *
     * @type {boolean}
     * @memberof Service
     */
    initialized: boolean;
    /**
     * 模式
     *
     * @type {string}
     * @memberof Service
     */
    mode: string;
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
        id: string;
        apply: {
            default: ServicePlugin;
            defaultModes?: ServicePluginModes;
        };
    }[];
    /**
     * 模式集合
     *
     * @type {ServicePluginModes}
     * @memberof Service
     */
    modes: ServicePluginModes;
    /**
     * 项目配置
     *
     * @type {Options}
     * @memberof Service
     */
    projectOptions: Options;
    /**
     * package.json 所在目录
     *
     * @type {string}
     * @memberof Service
     */
    pkgContext: string;
    /**
     * package.json
     *
     * @type {{ [key: string]: any }}
     * @memberof Service
     */
    pkg: {
        [key: string]: any;
    };
    /**
     * Creates an instance of Service.
     *
     * @param {string} context
     * @memberof Service
     */
    constructor(context: string);
    /**
     * 初始化
     *
     * @param {string} [mode=process.env.DORA_CLI_CONTEXT]
     * @memberof Service
     */
    private init;
    /**
     * 启动服务
     *
     * @param {string} name 当前命令
     * @param {ServiceRunArgs} [args={ _: undefined }]
     * @param {string[]} [rawArgv=[]]
     * @returns
     * @memberof Service
     */
    run(name: string, args?: ServiceRunArgs, rawArgv?: string[]): Promise<any>;
    /**
     * 解析 package.json 文件
     *
     * @param {string} [context=this.context]
     * @returns
     * @memberof Service
     */
    private resolvePkg;
    /**
     * 解析插件
     *
     * @returns
     * @memberof Service
     */
    private resolvePlugins;
    /**
     * 加载项目配置
     *
     * @returns
     * @memberof Service
     */
    private loadUserOptions;
}
/**
 * CLI 服务对应的命令
 *
 * @export
 * @interface ServiceCommand
 */
export interface ServiceCommand {
    /** 命令对应的函数 */
    fn: ServiceCommandFn;
    /** 命令对应的参数 */
    opts: ServiceCommandOpts;
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
    description?: string;
    /**
     * Command usage.
     *
     * @type {string}
     */
    usage?: string;
    /**
     * Command details.
     *
     * @type {string}
     */
    details?: string;
    /**
     * Command options.
     *
     * @type {{
     *     [key: string]: any
     *   }}
     */
    options?: {
        [key: string]: any;
    };
}
/**
 * 命令对应的函数
 *
 * @export
 */
export declare type ServiceCommandFn = (args?: ServiceRunArgs, rawArgs?: string[]) => void | Promise<any>;
/**
 * CLI 服务启动的参数
 *
 * @export
 * @interface ServiceRunArgs
 * @extends {minimist.ParsedArgs}
 */
export interface ServiceRunArgs extends minimist.ParsedArgs {
    /** 模式 */
    mode?: any;
    /** 监听 */
    watch?: any;
    /** 版本 */
    version?: any;
    /** 版本, 缩写 */
    V?: any;
    /** 帮助 */
    help?: any;
    /** 帮助, 缩写 */
    h?: any;
}
/**
 * 插件对应的函数
 *
 * @export
 */
export declare type ServicePlugin = (api: PluginAPI, options: Options) => void;
/**
 * 插件对应的模式
 *
 * @export
 * @interface ServicePluginModes
 */
export interface ServicePluginModes {
    [key: string]: string;
}
