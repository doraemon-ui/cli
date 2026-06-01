"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.USE_NPX = exports.IS_WIN32 = exports.root = exports.cwd = void 0;
const find_parent_dir_1 = __importDefault(require("find-parent-dir"));
const command_exists_1 = __importDefault(require("command-exists"));
const cwd = process.cwd();
exports.cwd = cwd;
const root = find_parent_dir_1.default.sync(cwd, 'lerna.json');
exports.root = root;
const IS_WIN32 = process.platform === 'win32';
exports.IS_WIN32 = IS_WIN32;
const USE_NPX = command_exists_1.default.sync('npx');
exports.USE_NPX = USE_NPX;
