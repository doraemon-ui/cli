import { DevServer } from '../../options';
/**
 * miniprogram ci
 *
 * @export
 * @class MiniprogramServer
 */
export declare class MiniprogramServer {
    /**
     * 项目路径
     *
     * @type {string}
     * @memberof MiniprogramServer
     */
    project: string;
    /**
     * 接口的公共 URL 路径
     *
     * @type {string}
     * @memberof MiniprogramServer
     */
    publicUrl: string;
    /**
     * Creates an instance of MiniprogramServer.
     *
     * @param {DevServer} devServer
     * @memberof MiniprogramServer
     */
    constructor(devServer: DevServer);
    /**
     * 启动工具
     *
     * @param {string} [project=this.project] 项目路径
     * @returns
     * @memberof MiniprogramServer
     */
    open(project?: string): Promise<import("axios").AxiosResponse<any>>;
    /**
     * 构建 npm
     *
     * @param {string} [project=this.project] 项目路径
     * @returns
     * @memberof MiniprogramServer
     */
    buildnpm(project?: string): Promise<import("axios").AxiosResponse<any>>;
}
