"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = void 0;
const chalk_1 = __importDefault(require("chalk"));
function error(msg) {
    console.log(chalk_1.default.red(`[dora error]: ${msg}`));
}
exports.error = error;
