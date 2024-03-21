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
exports.installPackage = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const lerna_1 = require("../utils/lerna");
function install(api, options) {
    api.registerCommand('install', {
        description: 'Install a single dependency to matched packages',
        usage: 'install [packageName]',
        options: {
            '--dev': 'Save to devDependencies',
        },
    }, async (args, rawArgs) => {
        await installPackage(api.getCwd(), args._[0], args.dev);
    });
}
exports.default = install;
async function installPackage(to, packageName, dev = false) {
    const packageJSONPath = path.join(to, 'package.json');
    if (!fs.existsSync(packageJSONPath)) {
        return Promise.reject('当前目录找不到 package.json 文件');
    }
    const cwdPackageJSON = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'));
    const cwdPackageName = cwdPackageJSON.name;
    if (!cwdPackageJSON.name) {
        return Promise.reject('当前目录 package.json 缺少 name 属性');
    }
    if (packageName && packageName.length) {
        await addPackage(packageName, dev, cwdPackageName);
    }
    else {
        await installPackageDependencies(cwdPackageName);
    }
}
exports.installPackage = installPackage;
/**
 * 执行 lerna bootstrap
 * 安装 package.json 中的依赖
 */
async function installPackageDependencies(scope) {
    await (0, lerna_1.runLernaCommand)([
        'bootstrap',
        `--scope=${scope}`,
    ], `正在安装 ${scope} 的依赖`, '安装完成惹');
}
/**
 * 执行 lerna add <packageName>
 * 安装特定依赖
 * @param packageName 要安装的包名
 */
async function addPackage(packageName, dev, scope) {
    if (!packageName) {
        return;
    }
    await (0, lerna_1.runLernaCommand)([
        'add',
        packageName,
        `--scope=${scope}`,
    ].concat(dev ? ['--dev'] : []), `正在安装 ${packageName} 到当前目录`, '安装完成惹');
}
