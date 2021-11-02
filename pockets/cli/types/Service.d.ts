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
export interface ServiceCommand {
    fn: ServiceCommandFn;
    opts: ServiceCommandOpts;
}
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
export declare type ServiceCommandFn = (args?: ServiceRunArgs, rawArgs?: string[]) => void | Promise<any>;
export interface ServiceRunArgs extends minimist.ParsedArgs {
    mode?: any;
    watch?: any;
    version?: any;
    V?: any;
    help?: any;
    h?: any;
}
export declare type ServicePlugin = (api: PluginAPI, options: Options) => void;
export interface ServicePluginModes {
    [key: string]: string;
}
