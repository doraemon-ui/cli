"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const PluginAPI_1 = require("./PluginAPI");
const version_1 = require("./utils/version");
const error_1 = require("./utils/error");
const version_2 = require("./version");
const options_1 = require("./options");
const lodash_defaultsdeep_1 = __importDefault(require("lodash.defaultsdeep"));
/**
 * Dora CLI
 *
 * @export
 * @class Service
 */
class Service {
    /**
     * 当前工作目录
     *
     * @type {string}
     * @memberof Service
     */
    context;
    /**
     * CLI 命令集合
     *
     * @type {{ [key: string]: ServiceCommand }}
     * @memberof Service
     */
    commands = {};
    /**
     * 是否已初始化服务
     *
     * @type {boolean}
     * @memberof Service
     */
    initialized = false;
    /**
     * 模式
     *
     * @type {string}
     * @memberof Service
     */
    mode;
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
    plugins = [];
    /**
     * 模式集合
     *
     * @type {ServicePluginModes}
     * @memberof Service
     */
    modes = {};
    /**
     * 项目配置
     *
     * @type {Options}
     * @memberof Service
     */
    projectOptions = {};
    /**
     * package.json 所在目录
     *
     * @type {string}
     * @memberof Service
     */
    pkgContext;
    /**
     * package.json
     *
     * @type {{ [key: string]: any }}
     * @memberof Service
     */
    pkg = {};
    /**
     * Creates an instance of Service.
     *
     * @param {string} context
     * @memberof Service
     */
    constructor(context) {
        this.context = context;
        this.pkgContext = context;
        this.pkg = this.resolvePkg();
        this.plugins = this.resolvePlugins();
        this.modes = this.plugins.reduce((modes, { apply: { defaultModes } }) => {
            return Object.assign(modes, defaultModes);
        }, {});
    }
    /**
     * 初始化
     *
     * @param {string} [mode=process.env.DORA_CLI_CONTEXT]
     * @memberof Service
     */
    init(mode = process.env.DORA_CLI_CONTEXT) {
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        this.mode = mode;
        // load user config
        const userOptions = this.loadUserOptions();
        this.projectOptions = (0, lodash_defaultsdeep_1.default)(userOptions, (0, options_1.defaults)());
        this.plugins.forEach(({ id, apply }) => {
            apply.default(new PluginAPI_1.PluginAPI(id, this), this.projectOptions);
        });
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
    async run(name, args = { _: undefined }, rawArgv = []) {
        const mode = args.mode || (name === 'build' && args.watch ? 'development' : this.modes[name]);
        this.init(mode);
        args._ = args._ || [];
        let command = this.commands[name];
        if (!command && name) {
            (0, error_1.error)(`command "${name}" does not exist.`);
            process.exit(1);
        }
        if (args.version || args.V) {
            console.log(version_2.version);
            return Promise.resolve(true);
        }
        else if (!command || args.help || args.h) {
            command = this.commands.help;
        }
        else {
            args._.shift();
            rawArgv.shift();
        }
        await (0, version_1.checkVersion)();
        const { fn } = command;
        return fn(args, rawArgv);
    }
    /**
     * 解析 package.json 文件
     *
     * @param {string} [context=this.context]
     * @returns
     * @memberof Service
     */
    resolvePkg(context = this.context) {
        const packageJSONPath = path.join(context, 'package.json');
        if (fs.existsSync(packageJSONPath)) {
            const pgk = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'));
            return pgk;
        }
        else {
            return {};
        }
    }
    /**
     * 解析插件
     *
     * @returns
     * @memberof Service
     */
    resolvePlugins() {
        const idToPlugin = (id) => ({
            id: id.replace(/^.\//, 'built-in:'),
            apply: require(id),
        });
        const builtInPlugins = [
            './commands/build',
            './commands/create',
            './commands/help',
            './commands/install',
            './commands/serve',
        ].map(idToPlugin);
        return builtInPlugins;
    }
    /**
     * 加载项目配置
     *
     * @returns
     * @memberof Service
     */
    loadUserOptions() {
        // dora.config.js
        let fileConfig, resolved;
        const configPath = (process.env.DORA_CLI_CONFIG_PATH ||
            path.resolve(this.context, 'dora.config.js'));
        if (fs.existsSync(configPath)) {
            try {
                fileConfig = require(configPath);
                if (typeof fileConfig === 'function') {
                    fileConfig = fileConfig();
                }
                if (!fileConfig || typeof fileConfig !== 'object') {
                    (0, error_1.error)('Error loading dora.config.js: should export an object or a function that returns object.');
                    fileConfig = null;
                }
            }
            catch (e) {
                (0, error_1.error)('Error loading dora.config.js:');
                throw e;
            }
        }
        if (fileConfig) {
            resolved = fileConfig;
        }
        else {
            resolved = {};
        }
        return resolved;
    }
}
exports.Service = Service;
