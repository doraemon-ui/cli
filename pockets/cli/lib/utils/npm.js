"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNpmCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const spawn_1 = require("./spawn");
const config_1 = require("../config");
const npm = config_1.IS_WIN32 ? 'npm.cmd' : 'npm';
/**
 * 执行 npm 指令
 * @param args npm 命令参数
 * @param onStartMsg
 * @param onCloseMsg
 */
function runNpmCommand(args = [], onStartMsg = '', onCloseMsg = '') {
    let command = npm;
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
exports.runNpmCommand = runNpmCommand;
