import axios from 'axios'
import { DevServer } from '../../options'

/**
 * miniprogram ci
 *
 * @export
 * @class MiniprogramServer
 */
export class MiniprogramServer {
  /**
   * 项目路径
   *
   * @type {string}
   * @memberof MiniprogramServer
   */
  project: string

  /**
   * 接口的公共 URL 路径
   *
   * @type {string}
   * @memberof MiniprogramServer
   */
  publicUrl: string

  /**
   * Creates an instance of MiniprogramServer.
   *
   * @param {DevServer} devServer
   * @memberof MiniprogramServer
   */
  constructor (devServer: DevServer) {
    const protocol = devServer.https ? 'https' : 'http'
    this.project = devServer.entry as string
    this.publicUrl = `${protocol}://${devServer.host}:${devServer.port}/v2`
  }

  /**
   * 启动工具
   *
   * @param {string} [project=this.project] 项目路径
   * @returns
   * @memberof MiniprogramServer
   */
  public open (project: string = this.project) {
    return axios.get(`${this.publicUrl}/open`, {
      params: {
        project,
      },
    })
  }

  /**
   * 构建 npm
   *
   * @param {string} [project=this.project] 项目路径
   * @returns
   * @memberof MiniprogramServer
   */
  public buildnpm (project: string = this.project) {
    return axios.get(`${this.publicUrl}/buildnpm`, {
      params: {
        project,
        'compile-type': 'miniprogram',
      },
    })
  }
}
