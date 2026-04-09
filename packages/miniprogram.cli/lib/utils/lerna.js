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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLernaCommand = runLernaCommand;
exports.getLernaConfig = getLernaConfig;
const chalk_1 = __importDefault(require("chalk"));
const path = __importStar(require("path"));
const spawn_1 = require("./spawn");
const config_1 = require("../config");
const lerna = config_1.IS_WIN32 ? 'lerna.cmd' : 'lerna';
/**
 * 执行 lerna 指令
 * @param args lerna 命令参数
 * @param onStartMsg
 * @param onCloseMsg
 */
function runLernaCommand(args = [], onStartMsg = '', onCloseMsg = '') {
    let command = lerna;
    // 如果装有 npx 则使用 npx 执行
    if (config_1.USE_NPX) {
        args.unshift(command);
        command = config_1.IS_WIN32 ? 'npx.cmd' : 'npx';
    }
    console.log(chalk_1.default.gray('Running '), chalk_1.default.inverse(`${command} ${args.join(' ')}`));
    console.log(chalk_1.default.green(onStartMsg));
    return new Promise((resolve, reject) => {
        (0, spawn_1.spawn)({
            useStdIn: true,
            command,
            args,
            options: {
                cwd: config_1.root,
            },
            onError(err) {
                console.log(chalk_1.default.red(err.message));
                reject(err);
            },
            onClose() {
                console.log(chalk_1.default.green(onCloseMsg));
                resolve();
            },
        });
    });
}
/**
 * 获取 lerna 配置信息
 */
function getLernaConfig() {
    const lernaConfig = require(path.resolve(config_1.root, 'lerna.json'));
    return lernaConfig || {};
}
