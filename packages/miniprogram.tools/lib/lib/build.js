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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
const rollup = __importStar(require("rollup"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Powered by rollup
 *
 * @param {{
 *   inputOptions: RollupInputOptions
 *   outputOptions: RollupOutOptions
 * }} { inputOptions, outputOptions }
 */
async function build({ inputOptions, outputOptions }) {
    console.log('Powered by rollup');
    try {
        console.log(chalk_1.default.gray(`building ${outputOptions.file}...\n`));
        const bundle = await rollup.rollup(inputOptions);
        await bundle.write(outputOptions);
        console.log(chalk_1.default.cyan('Building complete\n'));
    }
    catch (err) {
        console.error(chalk_1.default.red(err));
    }
}
exports.build = build;
