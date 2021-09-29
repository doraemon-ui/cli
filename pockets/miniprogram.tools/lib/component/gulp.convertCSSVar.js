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
const util = __importStar(require("gulp-util"));
const through2 = __importStar(require("through2"));
const css_tree_1 = __importDefault(require("css-tree"));
const cssbeautify_1 = __importDefault(require("cssbeautify"));
const PluginError = util.PluginError;
const defaultConfig = {
    bodyNode: 'body',
    rootNode: 'root',
};
// 常量
const PLUGIN_NAME = 'gulp-convert-css-var';
//颜色map
let colorMap = {};
//检查是否在媒体查询中有dark mode
function checkIsDarkRule(ast) {
    let isDark = false;
    if (!ast)
        return false;
    css_tree_1.default.walk(ast, (node) => {
        if (node.type == 'MediaFeature' && node.name == 'prefers-color-scheme' && node.value.name == 'dark') {
            isDark = true;
        }
    });
    return isDark;
}
//检查是否是在body或者root中
function checkIsRootTag(ast, options) {
    let isRoot = false;
    if (!ast)
        return false;
    css_tree_1.default.walk(ast, (node, item) => {
        if ((node.type == 'TypeSelector' && node.name == options.bodyNode) ||
            (node.type == 'PseudoClassSelector' && node.name == options.rootNode)) {
            isRoot = true;
        }
    });
    return isRoot;
}
// 检查是否是单纯的选择器，没有属性选择器之类的。
function checkIsSingleRoot(ast, options) {
    let isSingle = false;
    if (!ast)
        return false;
    css_tree_1.default.walk(ast, {
        enter(node, item) {
            if ((node.type == 'TypeSelector' && node.name == options.bodyNode) ||
                (node.type == 'PseudoClassSelector' && node.name == options.rootNode)) {
                if (!item.prev && !item.next) {
                    isSingle = true;
                }
            }
        },
    });
    return isSingle;
}
function gulpProfixer(opts) {
    const options = Object.assign({}, defaultConfig, opts || {});
    //创建一个 stream 通道，让每个文件通过
    let stream = through2.obj(function (file, enc, cb) {
        //不支持stream
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'It does not support stream for now, contact the developers for further support.'));
            return cb();
        }
        let contents = file.contents.toString();
        let ast = css_tree_1.default.parse(contents);
        css_tree_1.default.walk(ast, {
            visit: 'Declaration',
            enter(node) {
                //找出变量定义的规则
                if (node.property &&
                    node.property.match(/^--/)) {
                    let isMediaDark = checkIsDarkRule(this.atrule), isRootTag = checkIsRootTag(this.rule.prelude, options), isSingle = checkIsSingleRoot(this.rule.prelude, options);
                    // 是黑暗模式的变量
                    if (isMediaDark && isRootTag) {
                        colorMap[`${node.property}_dark`] = node.value;
                    }
                    // 是默认模式的变量
                    else if (!isMediaDark && isSingle) {
                        colorMap[node.property] = node.value;
                    }
                }
            },
        });
        // 给所有通过变量赋值的颜色多加一个保底的颜色
        css_tree_1.default.walk(ast, function (pnode, item, list) {
            if (pnode.type == 'Declaration') {
                let varNames = [];
                css_tree_1.default.walk(pnode, function (node) {
                    if (node.type === 'Function' && node.name === 'var') {
                        // 取出颜色的变量名字
                        let varName = '';
                        css_tree_1.default.walk(node, (cnode) => {
                            if (cnode.type == 'Identifier') {
                                varName = cnode.name;
                                varNames.push(cnode.name);
                            }
                        });
                    }
                });
                // 证明有变量
                if (varNames.length) {
                    let cssStyle = css_tree_1.default.generate(pnode);
                    for (let name of varNames) {
                        if (colorMap[name]) {
                            let reg = new RegExp('var\\(\\s*' + name + '\\s*\\)');
                            cssStyle = cssStyle.replace(reg, colorMap[name].value.trim());
                        }
                    }
                    let rule = {
                        prev: null,
                        next: null,
                        data: css_tree_1.default.parse(cssStyle, {
                            context: 'declaration',
                        }),
                    };
                    list.insert(rule, item);
                }
            }
        });
        let css = css_tree_1.default.generate(ast);
        let bu = Buffer.from((0, cssbeautify_1.default)(css, {
            indent: '  ',
            openbrace: 'end-of-line',
            autosemicolon: true,
        }));
        file.contents = bu;
        // 给下一个插件提供文件
        this.push(file);
        // 告诉stream引擎，我们已经处理完成了这个文件
        cb();
    });
    return stream;
}
exports.default = gulpProfixer;
