"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginAPI = void 0;
const path = __importStar(require("path"));
const version_1 = require("./version");
/**
 * Dora PluginAPI.
 *
 * @export
 * @class PluginAPI
 */
class PluginAPI {
    /**
     * Id of the plugin.
     *
     * @type {string}
     * @memberof PluginAPI
     */
    id;
    /**
     * A CLI instance.
     *
     * @type {Service}
     * @memberof PluginAPI
     */
    service;
    /**
     * Creates an instance of PluginAPI.
     *
     * @param {string} id Id of the plugin.
     * @param {Service} service A CLI instance.
     * @memberof PluginAPI
     */
    constructor(id, service) {
        this.id = id;
        this.service = service;
    }
    /**
     * CLI version.
     *
     * @readonly
     * @memberof PluginAPI
     */
    get version() {
        return version_1.version;
    }
    /**
     * Current working directory.
     *
     * @returns
     * @memberof PluginAPI
     */
    getCwd() {
        return this.service.context;
    }
    /**
     * Resolve path for a project.
     *
     * @param {string} _path Specified path.
     * @returns
     * @memberof PluginAPI
     */
    resolve(_path) {
        return path.resolve(this.service.context, _path);
    }
    /**
     * Check if the project has a given plugin.
     *
     * @param {string} id Plugin id.
     * @returns
     * @memberof PluginAPI
     */
    hasPlugin(id) {
        return this.service.plugins.some(p => id === p.id);
    }
    /**
     * Register a command that will become available as `dora [name]`.
     *
     * @param {string} name
     * @param {(ServiceCommandOpts | ServiceCommandFn | null)} opts
     * @param {ServiceCommandFn} [fn]
     * @memberof PluginAPI
     */
    registerCommand(name, opts, fn) {
        if (typeof opts === 'function') {
            fn = opts;
            opts = null;
        }
        this.service.commands[name] = { fn: fn, opts: opts || {} };
    }
}
exports.PluginAPI = PluginAPI;
