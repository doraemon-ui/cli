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
exports.rewrite = exports.writeFile = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function writeFile(filename, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, content, 'utf-8', (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(content);
            }
        });
    });
}
exports.writeFile = writeFile;
function rewrite({ filePath, fileName, transformData, }) {
    const isJSON = fileName.endsWith('.json');
    const fpath = path.join(filePath, fileName);
    const fcontent = isJSON ? require(fpath) : fs.readFileSync(fpath, 'utf8');
    const data = isJSON ? transformData.call(null, { ...fcontent }) : transformData.call(null, fcontent);
    return writeFile(fpath, data);
}
exports.rewrite = rewrite;
