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
exports.create = void 0;
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const git_user_name_1 = __importDefault(require("git-user-name"));
const config_1 = require("../../config");
const install_1 = require("../install");
const copy_1 = require("../../utils/copy");
const prompt_1 = require("../../utils/prompt");
const rewrite_1 = require("../../utils/rewrite");
/**
 * 下划线转大写驼峰
 *
 * @param {string} str
 * @param {string} [split='-']
 * @returns
 */
function toUpperCase(str, split = '-') {
    return str.split(split).reduce((acc, name) => {
        return acc += `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    }, '');
}
function renderJSON(content, getData) {
    const data = getData.call(null, { ...content });
    for (let key in data) {
        content[key] = data[key];
    }
    return JSON.stringify(content, null, 2);
}
function renderFile(content, packageName = '', componentNameShort = '') {
    return content
        .replace(/{{packageName}}/g, packageName)
        .replace(/DemoComponent/g, toUpperCase(componentNameShort))
        .replace(/demo-component/g, componentNameShort)
        .replace(/DemoLib/g, toUpperCase(componentNameShort))
        .replace(/demo-lib/g, componentNameShort);
}
function rewritePackageJSON(componentPath, getData) {
    return (0, rewrite_1.rewrite)({
        filePath: componentPath,
        fileName: 'package.json',
        transformData(data) {
            return renderJSON(data, getData);
        },
    });
}
function rewriteTypeDeclare(componentPath, packageName) {
    return (0, rewrite_1.rewrite)({
        filePath: componentPath,
        fileName: 'index.d.ts',
        transformData(data) {
            return renderFile(data, packageName);
        },
    });
}
function rewriteReadme(componentPath, packageName) {
    return (0, rewrite_1.rewrite)({
        filePath: componentPath,
        fileName: 'README.md',
        transformData(data) {
            return renderFile(data, packageName);
        },
    });
}
async function rewriteDemo(rootName, author, packageJSON, cwd) {
    const distDir = path.join(cwd, rootName, 'proscenium');
    const packageName = packageJSON.name;
    const packageVer = packageJSON.version;
    const componentName = packageName.split('/')[packageName.split('/').length - 1];
    const componentNameShort = componentName.split('.')[componentName.split('.').length - 1];
    await (0, rewrite_1.rewrite)({
        filePath: distDir,
        fileName: 'project.config.json',
        transformData(data) {
            return renderJSON(data, () => ({
                projectname: `${packageName}-proscenium`,
            }));
        },
    });
    await rewritePackageJSON(path.join(distDir, 'pages'), (packageJSON) => ({
        name: `${packageName}-proscenium`,
        private: true,
        description: `${componentName.split('.').join(' ')} component demo for doraemon-ui`,
        author,
        keywords: [...packageJSON.keywords, ...componentName.split('.')],
        dependencies: {
            [packageName]: `^${packageVer}`,
        },
    }));
    await (0, rewrite_1.rewrite)({
        filePath: path.join(distDir, 'pages/index'),
        fileName: 'index.json',
        transformData(data) {
            return renderJSON(data, () => ({
                navigationBarTitleText: componentName,
                usingComponents: {
                    [`dora-${componentNameShort}`]: `${packageName}/index`,
                },
            }));
        },
    });
    await (0, rewrite_1.rewrite)({
        filePath: path.join(distDir, 'pages/index'),
        fileName: 'index.wxml',
        transformData(data) {
            return data.replace(/{{componentName}}/g, componentName)
                .replace(/{{componentFragment}}/g, `<dora-${componentNameShort}>${componentName}</dora-${componentNameShort}>`);
        },
    });
}
/**
 * 预设组件模板
 *
 * @export
 * @param {string} cwd 当前工作目录
 * @param {string} name 组件名
 * @param {ComponentType} componentType 组件模板
 * @param {NpmScope} npmScope 组件所属的 npm 域
 * @returns
 */
async function create(cwd, name, componentType, npmScope) {
    if (!name) {
        return Promise.reject('缺少 name 参数');
    }
    const type = componentType || await (0, prompt_1.getComponentType)();
    switch (type) {
        case prompt_1.ComponentType.MiniprogramLib:
            createLib(cwd, name, type, npmScope);
            break;
        case prompt_1.ComponentType.MiniprogramComponent:
            createComponent(cwd, name, type, npmScope);
            break;
        case prompt_1.ComponentType.MiniprogramComponentSnippet:
            createComponentSnippet(cwd, name, type);
            break;
    }
}
exports.create = create;
/**
 * 创建小程序组件模板
 *
 * @param {string} cwd 当前工作目录
 * @param {string} name 组件名称
 * @param {ComponentType} type 组件模板
 * @param {NpmScope} npmScope 组件所属的 npm 域
 * @returns
 */
async function createComponent(cwd, name, type, npmScope) {
    if (!name) {
        return Promise.reject('缺少 name 参数');
    }
    const scope = npmScope || await (0, prompt_1.getNpmScope)();
    const author = (0, git_user_name_1.default)();
    const template = path.join(config_1.templatesDir, type);
    const distDir = path.join(cwd, name);
    await (0, copy_1.copyFolder)(template, distDir);
    const packageName = `${scope}/${name}`;
    const componentNameShort = name.split('.')[name.split('.').length - 1];
    const packageJSON = await rewritePackageJSON(distDir, (packageJSON) => ({
        name: packageName,
        private: false,
        description: `${name.split('.').join(' ')} component for doraemon-ui`,
        author,
        keywords: [...packageJSON.keywords, ...name.split('.')],
    }));
    await rewriteTypeDeclare(distDir, packageName);
    await rewriteReadme(distDir, packageName);
    await (0, rewrite_1.rewrite)({
        filePath: path.join(distDir, 'src'),
        fileName: 'index.ts',
        transformData(data) {
            return renderFile(data, packageName, componentNameShort);
        },
    });
    await (0, rewrite_1.rewrite)({
        filePath: path.join(distDir, '__tests__'),
        fileName: 'index.spec.ts',
        transformData(data) {
            return renderFile(data, packageName, componentNameShort);
        },
    });
    await (0, rewrite_1.rewrite)({
        filePath: path.join(distDir, 'assets'),
        fileName: 'variables.less',
        transformData(data) {
            return renderFile(data, packageName, componentNameShort);
        },
    });
    await (0, rewrite_1.rewrite)({
        filePath: path.join(distDir, 'assets'),
        fileName: 'index.less',
        transformData(data) {
            return renderFile(data, packageName, componentNameShort);
        },
    });
    await rewriteDemo(name, author, JSON.parse(packageJSON), cwd);
    await (0, install_1.installPackage)(distDir, '');
}
/**
 * 创建小程序组件片段
 *
 * @param {string} cwd 当前工作目录
 * @param {string} name 组件名称
 * @param {ComponentType} type 组件模板
 * @returns
 */
async function createComponentSnippet(cwd, name, type) {
    if (!name) {
        return Promise.reject('缺少 name 参数');
    }
    const template = path.join(config_1.templatesDir, type);
    const distDir = path.join(cwd);
    await (0, copy_1.copyFolder)(template, distDir, {
        rename(target) {
            const reg = /index(.\w+)$/;
            const match = target.match(reg);
            return match ? target.replace(reg, `${name}${match[1]}`) : target;
        },
    });
    await (0, rewrite_1.rewrite)({
        filePath: distDir,
        fileName: `${name}.ts`,
        transformData(data) {
            return renderFile(data, '', name);
        },
    });
    console.log(chalk_1.default.green('安装完成惹'));
}
/**
 * 创建小程序库模板
 *
 * @param {string} cwd 当前工作目录
 * @param {string} name 库名称
 * @param {ComponentType} type 库模板
 * @param {NpmScope} npmScope 库所属的 npm 域
 * @returns
 */
async function createLib(cwd, name, type, npmScope) {
    if (!name) {
        return Promise.reject('缺少 name 参数');
    }
    const scope = npmScope || await (0, prompt_1.getNpmScope)();
    const author = (0, git_user_name_1.default)();
    const template = path.join(config_1.templatesDir, type);
    const distDir = path.join(cwd, name);
    await (0, copy_1.copyFolder)(template, distDir);
    const packageName = `${scope}/${name}`;
    const componentNameShort = name.split('.')[name.split('.').length - 1];
    await rewritePackageJSON(distDir, (packageJSON) => ({
        name: packageName,
        private: false,
        description: `${name.split('.').join(' ')} lib for doraemon-ui`,
        author,
        keywords: [...packageJSON.keywords, ...name.split('.')],
    }));
    await rewriteTypeDeclare(distDir, packageName);
    await rewriteReadme(distDir, packageName);
    await (0, rewrite_1.rewrite)({
        filePath: path.join(distDir, 'src'),
        fileName: 'index.ts',
        transformData(data) {
            return renderFile(data, packageName, componentNameShort);
        },
    });
    await (0, rewrite_1.rewrite)({
        filePath: path.join(distDir, '__tests__'),
        fileName: 'index.spec.ts',
        transformData(data) {
            return renderFile(data, packageName, componentNameShort);
        },
    });
    await (0, install_1.installPackage)(distDir, '');
}
