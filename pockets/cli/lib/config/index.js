"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.USE_NPX = exports.IS_WIN32 = exports.templatesDir = exports.root = exports.cwd = void 0;
const path = __importStar(require("path"));
const find_parent_dir_1 = __importDefault(require("find-parent-dir"));
const command_exists_1 = __importDefault(require("command-exists"));
const cwd = process.cwd();
exports.cwd = cwd;
const root = find_parent_dir_1.default.sync(cwd, 'lerna.json');
exports.root = root;
const templatesDir = path.resolve(__dirname, '../../templates');
exports.templatesDir = templatesDir;
const IS_WIN32 = process.platform === 'win32';
exports.IS_WIN32 = IS_WIN32;
const USE_NPX = command_exists_1.default.sync('npx');
exports.USE_NPX = USE_NPX;
