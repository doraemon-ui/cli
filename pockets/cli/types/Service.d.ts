import { Options } from './options';
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
     * @type {{ [key: string]: any }}
     * @memberof Service
     */
    commands: {
        [key: string]: any;
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
     *     apply: any
     *   }[]}
     * @memberof Service
     */
    plugins: {
        id: string;
        apply: any;
    }[];
    /**
     * 模式集合
     *
     * @type {{ [key: string]: any }}
     * @memberof Service
     */
    modes: {
        [key: string]: any;
    };
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
     * @param {*} [args={}]
     * @param {*} [rawArgv=[]]
     * @returns
     * @memberof Service
     */
    run(name: string, args?: any, rawArgv?: any): Promise<any>;
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
