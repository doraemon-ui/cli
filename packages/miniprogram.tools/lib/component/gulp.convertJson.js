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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const util = __importStar(require("gulp-util"));
const through2 = __importStar(require("through2"));
const findComponentPath = (base, str) => {
    const paths = str.split('/');
    const length = paths.length - 1;
    const componentName = paths[length];
    let i = paths.length - 1;
    let pgk = undefined;
    while (i) {
        const packageJSONPath = path.join(base, paths.slice(0, i).join('/'), 'package.json');
        if (fs.existsSync(packageJSONPath)) {
            pgk = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'));
            break;
        }
        i--;
    }
    return pgk ? `${pgk.name}/${componentName}` : str;
};
const isJsonFile = (filename) => {
    return /\.json$/i.test(filename);
};
const convertJson = () => {
    const replace = (str = '', file) => {
        if (isJsonFile(file.path)) {
            const jsonValue = JSON.parse(str);
            if (jsonValue.usingComponents) {
                const usingComponents = {};
                Object.keys(jsonValue.usingComponents).forEach((key) => {
                    usingComponents[key] = findComponentPath(file.base, jsonValue.usingComponents[key]);
                });
                return JSON.stringify(Object.assign({}, jsonValue, { usingComponents }), null, 2);
            }
            return str;
        }
        return str;
    };
    return through2.obj(function (file, encoding, cb) {
        // 如果文件为空，不做任何操作，转入下一个操作，即下一个pipe
        if (file.isNull()) {
            this.push(file);
            return cb();
        }
        // 插件不支持对stream直接操作，抛出异常
        if (file.isStream()) {
            this.emit('error', new util.PluginError('convertJson', 'Streaming not supported'));
            return cb();
        }
        // 内容转换，处理好后，再转成 Buffer 形式
        const content = replace(file.contents.toString(), file);
        file.contents = typeof Buffer.from === 'function' ? Buffer.from(content) : new Buffer(content);
        // 下面这两句基本是标配，可参考 through2 的 API
        this.push(file);
        cb();
    });
};
exports.default = convertJson;
