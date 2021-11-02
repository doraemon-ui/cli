import { Service, ServiceCommandFn, ServiceCommandOpts } from './Service';
/**
 * Dora PluginAPI.
 *
 * @export
 * @class PluginAPI
 */
export declare class PluginAPI {
    /**
     * Id of the plugin.
     *
     * @type {string}
     * @memberof PluginAPI
     */
    id: string;
    /**
     * A CLI instance.
     *
     * @type {Service}
     * @memberof PluginAPI
     */
    service: Service;
    /**
     * Creates an instance of PluginAPI.
     *
     * @param {string} id Id of the plugin.
     * @param {Service} service A CLI instance.
     * @memberof PluginAPI
     */
    constructor(id: string, service: Service);
    /**
     * CLI version.
     *
     * @readonly
     * @memberof PluginAPI
     */
    get version(): string;
    /**
     * Current working directory.
     *
     * @returns
     * @memberof PluginAPI
     */
    getCwd(): string;
    /**
     * Resolve path for a project.
     *
     * @param {string} _path Specified path.
     * @returns
     * @memberof PluginAPI
     */
    resolve(_path: string): string;
    /**
     * Check if the project has a given plugin.
     *
     * @param {string} id Plugin id.
     * @returns
     * @memberof PluginAPI
     */
    hasPlugin(id: string): boolean;
    /**
     * Register a command that will become available as `dora [name]`.
     *
     * @param {string} name
     * @param {(ServiceCommandOpts | ServiceCommandFn | null)} opts
     * @param {ServiceCommandFn} [fn]
     * @memberof PluginAPI
     */
    registerCommand(name: string, opts: ServiceCommandOpts | ServiceCommandFn | null, fn?: ServiceCommandFn): void;
}
