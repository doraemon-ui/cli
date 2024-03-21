import * as path from 'path'
import { Service, ServiceCommandFn, ServiceCommandOpts } from './Service'
import { version } from './version'

/**
 * Dora PluginAPI.
 *
 * @export
 * @class PluginAPI
 */
export class PluginAPI {
  /**
   * Id of the plugin.
   *
   * @type {string}
   * @memberof PluginAPI
   */
  id: string

  /**
   * A CLI instance.
   *
   * @type {Service}
   * @memberof PluginAPI
   */
  service: Service

  /**
   * Creates an instance of PluginAPI.
   *
   * @param {string} id Id of the plugin.
   * @param {Service} service A CLI instance.
   * @memberof PluginAPI
   */
  constructor (id: string, service: Service) {
    this.id = id
    this.service = service
  }

  /**
   * CLI version.
   *
   * @readonly
   * @memberof PluginAPI
   */
  get version () {
    return version
  }

  /**
   * Current working directory.
   *
   * @returns
   * @memberof PluginAPI
   */
  getCwd () {
    return this.service.context
  }

  /**
   * Resolve path for a project.
   *
   * @param {string} _path Specified path.
   * @returns
   * @memberof PluginAPI
   */
  resolve (_path: string) {
    return path.resolve(this.service.context, _path)
  }

  /**
   * Check if the project has a given plugin.
   *
   * @param {string} id Plugin id.
   * @returns
   * @memberof PluginAPI
   */
  hasPlugin (id: string) {
    return this.service.plugins.some(p => id === p.id)
  }

  /**
   * Register a command that will become available as `dora [name]`.
   *
   * @param {string} name
   * @param {(ServiceCommandOpts | ServiceCommandFn | null)} opts
   * @param {ServiceCommandFn} [fn]
   * @memberof PluginAPI
   */
  registerCommand (name: string, opts: ServiceCommandOpts | ServiceCommandFn | null, fn?: ServiceCommandFn) {
    if (typeof opts === 'function') {
      fn = opts
      opts = null
    }
    this.service.commands[name] = { fn, opts: opts as ServiceCommandOpts || {}}
  }
}
