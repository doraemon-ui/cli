"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniprogramServer = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * miniprogram ci
 *
 * @export
 * @class MiniprogramServer
 */
class MiniprogramServer {
    /**
     * 项目路径
     *
     * @type {string}
     * @memberof MiniprogramServer
     */
    project;
    /**
     * 接口的公共 URL 路径
     *
     * @type {string}
     * @memberof MiniprogramServer
     */
    publicUrl;
    /**
     * Creates an instance of MiniprogramServer.
     *
     * @param {DevServer} devServer
     * @memberof MiniprogramServer
     */
    constructor(devServer) {
        const protocol = devServer.https ? 'https' : 'http';
        this.project = devServer.entry;
        this.publicUrl = `${protocol}://${devServer.host}:${devServer.port}/v2`;
    }
    /**
     * 启动工具
     *
     * @param {string} [project=this.project] 项目路径
     * @returns
     * @memberof MiniprogramServer
     */
    open(project = this.project) {
        return axios_1.default.get(`${this.publicUrl}/open`, {
            params: {
                project,
            },
        });
    }
    /**
     * 构建 npm
     *
     * @param {string} [project=this.project] 项目路径
     * @returns
     * @memberof MiniprogramServer
     */
    buildnpm(project = this.project) {
        return axios_1.default.get(`${this.publicUrl}/buildnpm`, {
            params: {
                project,
                'compile-type': 'miniprogram',
            },
        });
    }
}
exports.MiniprogramServer = MiniprogramServer;
