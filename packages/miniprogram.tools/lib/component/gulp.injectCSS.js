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
const util = __importStar(require("gulp-util"));
const through2 = __importStar(require("through2"));
const injectCSS = () => {
    // 正则匹配
    const INJECT_REG = /\/\*! inject:wxss:(.*) \*\//;
    const END_INJECT_REG = /\/\*! endinject \*\//;
    const replace = (str = '') => {
        let startTag = str.match(INJECT_REG);
        let endTag = str.match(END_INJECT_REG);
        while (startTag && endTag) {
            const transformedContents = str.slice(startTag[0].length + (startTag.index || 0), endTag.index);
            str = str.replace(startTag[0], '')
                .replace(transformedContents, `@import '${startTag[1]}';\n`)
                .replace(endTag[0], '');
            startTag = str.match(INJECT_REG);
            endTag = str.match(END_INJECT_REG);
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
            this.emit('error', new util.PluginError('injectCSS', 'Streaming not supported'));
            return cb();
        }
        // 内容转换，处理好后，再转成 Buffer 形式
        const content = replace(file.contents.toString());
        file.contents = typeof Buffer.from === 'function' ? Buffer.from(content) : new Buffer(content);
        // 下面这两句基本是标配，可参考 through2 的 API
        this.push(file);
        cb();
    });
};
exports.default = injectCSS;
