"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyFolder = void 0;
const ncp_1 = __importDefault(require("ncp"));
function copyFolder(from, to, options = {}) {
    return new Promise((resolve, reject) => {
        (0, ncp_1.default)(from, to, options, function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve({});
            }
        });
    });
}
exports.copyFolder = copyFolder;
