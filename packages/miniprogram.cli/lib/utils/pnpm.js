"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPnpmCommand = runPnpmCommand;
const chalk_1 = __importDefault(require("chalk"));
const spawn_1 = require("./spawn");
const config_1 = require("../config");
const pnpm = config_1.IS_WIN32 ? 'pnpm.cmd' : 'pnpm';
function runPnpmCommand(args = [], onStartMsg = '', onCloseMsg = '') {
    console.log(chalk_1.default.gray('Running '), chalk_1.default.inverse(`${pnpm} ${args.join(' ')}`));
    console.log(chalk_1.default.green(onStartMsg));
    return new Promise((resolve, reject) => {
        (0, spawn_1.spawn)({
            useStdIn: true,
            command: pnpm,
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
