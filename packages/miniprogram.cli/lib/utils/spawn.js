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
exports.spawn = void 0;
const childProcess = __importStar(require("child_process"));
/**
 * 以 Spawn 方式运行外部程序.
 *
 * @param {ISpawnParam} param
 */
function spawn(param) {
    const options = param.options || {};
    let exec;
    if (param.useStdIn) {
        // https://nodejs.org/dist/latest-v8.x/docs/api/child_process.html#child_process_options_stdio
        Object.assign(options, {
            stdio: 'inherit',
        });
        exec = childProcess.spawn(param.command, param.args || [], options);
    }
    else {
        exec = childProcess.spawn(param.command, param.args || [], options);
        if (exec && exec.stdout && exec.stderr) {
            exec.stdout.pipe(process.stdout);
            exec.stderr.on('data', (data) => {
                data = data.toString();
                typeof param.onData === 'function' && param.onData(data);
            });
        }
    }
    exec.on('close', (code) => {
        typeof param.onClose === 'function' && param.onClose(code);
    });
    exec.on('error', error => {
        typeof param.onError === 'function' && param.onError(error);
    });
}
exports.spawn = spawn;
