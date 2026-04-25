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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildComponent = rollupBuild;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const chokidar_1 = __importDefault(require("chokidar"));
const rollup_1 = require("rollup");
const plugin_typescript_1 = __importDefault(require("@rollup/plugin-typescript"));
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
const rollup_plugin_copy_1 = __importDefault(require("rollup-plugin-copy"));
const postcss_1 = __importDefault(require("postcss"));
const autoprefixer_1 = __importDefault(require("autoprefixer"));
const less_1 = __importDefault(require("less"));
const cssbeautify_1 = __importDefault(require("cssbeautify"));
const css_tree_1 = __importDefault(require("css-tree"));
const util_1 = __importDefault(require("../shared/util"));
const buildDir = util_1.default.buildDir;
const rootDir = util_1.default.rootDir;
const extensions = ['.js', '.ts'];
const doraConfig = fs.existsSync(path.join(buildDir, 'dora.config.js'))
    ? path.join(buildDir, 'dora.config.js')
    : path.join(rootDir, 'dora.config.js');
const tsconfig = fs.existsSync(path.join(buildDir, 'tsconfig.json'))
    ? path.join(buildDir, 'tsconfig.json')
    : path.join(rootDir, 'tsconfig.json');
const defaultConfig = {
    entry: ['./src/**/*.ts', '!./src/**/*.d.ts', '!./src/**/types.ts'],
    outputDir: './miniprogram_dist',
    copyPlugin: {
        entry: ['./src/**/*.json', './src/**/*.wxml', './src/**/*.wxss', '!./src/**/*.ts'],
    },
    cssPlugin: {
        entry: ['./src/**/*.less'],
        pxTransform: {
            designWidth: 375,
        },
    },
};
let userConfig = {};
if (fs.existsSync(doraConfig)) {
    userConfig = require(doraConfig);
}
const config = Object.assign({}, defaultConfig, userConfig);
function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
function normalizePatterns(patterns) {
    return Array.isArray(patterns) ? patterns : [patterns];
}
function transformUsingComponents(content, filePath) {
    const fileDir = path.dirname(filePath);
    const value = JSON.parse(content);
    if (!value.usingComponents) {
        return content;
    }
    const usingComponents = {};
    Object.keys(value.usingComponents).forEach((key) => {
        const componentPath = value.usingComponents[key];
        usingComponents[key] = resolveComponentPath(fileDir, componentPath);
    });
    return JSON.stringify(Object.assign({}, value, { usingComponents }), null, 2);
}
function resolveComponentPath(base, str) {
    const paths = str.split('/');
    let i = paths.length - 1;
    let pkg;
    while (i > 0) {
        const packageJSONPath = path.join(base, paths.slice(0, i).join('/'), 'package.json');
        if (fs.existsSync(packageJSONPath)) {
            pkg = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'));
            break;
        }
        i--;
    }
    return pkg ? `${pkg.name}/${paths[paths.length - 1]}` : str;
}
function convertCssVars(css, options = { bodyNode: 'page', rootNode: 'root' }) {
    const colorMap = {};
    const ast = css_tree_1.default.parse(css);
    const checkIsDarkRule = (atrule) => {
        let isDark = false;
        if (!atrule)
            return false;
        css_tree_1.default.walk(atrule, {
            visit: 'Feature',
            enter(node) {
                if (node.name === 'prefers-color-scheme' && node.value && node.value.type === 'Identifier' && node.value.name === 'dark') {
                    isDark = true;
                }
            },
        });
        return isDark;
    };
    const checkIsRootTag = (astNode, opts) => {
        let isRoot = false;
        if (!astNode)
            return false;
        css_tree_1.default.walk(astNode, {
            enter(node) {
                if ((node.type === 'TypeSelector' && node.name === opts.bodyNode) ||
                    (node.type === 'PseudoClassSelector' && node.name === opts.rootNode)) {
                    isRoot = true;
                }
            },
        });
        return isRoot;
    };
    const checkIsSingleRoot = (astNode, opts) => {
        let isSingle = false;
        if (!astNode)
            return false;
        css_tree_1.default.walk(astNode, {
            enter(node, item) {
                if ((node.type === 'TypeSelector' && node.name === opts.bodyNode) ||
                    (node.type === 'PseudoClassSelector' && node.name === opts.rootNode)) {
                    if (!item.prev && !item.next) {
                        isSingle = true;
                    }
                }
            },
        });
        return isSingle;
    };
    css_tree_1.default.walk(ast, {
        visit: 'Declaration',
        enter(node, item, list) {
            if (node.property && /^--/.test(node.property)) {
                const isMediaDark = checkIsDarkRule(this.atrule);
                const isRootTag = checkIsRootTag(this.rule?.prelude, options);
                const isSingle = checkIsSingleRoot(this.rule?.prelude, options);
                if (isMediaDark && isRootTag) {
                    colorMap[`${node.property}_dark`] = { value: css_tree_1.default.generate(node.value) };
                }
                else if (!isMediaDark && isSingle) {
                    colorMap[node.property] = { value: css_tree_1.default.generate(node.value) };
                }
            }
        },
    });
    css_tree_1.default.walk(ast, (node, item, list) => {
        if (node.type === 'Declaration') {
            const varNames = [];
            css_tree_1.default.walk(node, (child) => {
                if (child.type === 'Function' && child.name === 'var') {
                    css_tree_1.default.walk(child, (inner) => {
                        if (inner.type === 'Identifier') {
                            varNames.push(inner.name);
                        }
                    });
                }
            });
            if (varNames.length) {
                let cssStyle = css_tree_1.default.generate(node);
                for (const name of varNames) {
                    if (colorMap[name]) {
                        const reg = new RegExp(`var\\(\\s*${name}\\s*\\)`, 'g');
                        cssStyle = cssStyle.replace(reg, colorMap[name].value.trim());
                    }
                }
                const rule = {
                    prev: null,
                    next: null,
                    data: css_tree_1.default.parse(cssStyle, { context: 'declaration' }),
                };
                list.insert(rule, item);
            }
        }
    });
    return (0, cssbeautify_1.default)(css_tree_1.default.generate(ast), {
        indent: '  ',
        openbrace: 'end-of-line',
        autosemicolon: true,
    });
}
function injectCssImports(content) {
    const INJECT_REG = /\/\*! inject:wxss:(.*) \*\//;
    const END_INJECT_REG = /\/\*! endinject \*\//;
    let result = content;
    let startMatch = result.match(INJECT_REG);
    let endMatch = result.match(END_INJECT_REG);
    while (startMatch && endMatch) {
        const startIndex = startMatch.index || 0;
        const endIndex = endMatch.index || 0;
        result = result.slice(0, startIndex) + `@import '${startMatch[1]}';\n` + result.slice(endIndex + endMatch[0].length);
        startMatch = result.match(INJECT_REG);
        endMatch = result.match(END_INJECT_REG);
    }
    return result;
}
function getOutputPath(file, ext) {
    const relativePath = path.relative(path.join(buildDir, 'src'), file);
    return path.join(buildDir, config.outputDir, relativePath.replace(/\.(ts|less|json|wxml|wxss)$/, ext));
}
async function compileStyles() {
    const patterns = normalizePatterns(config.cssPlugin.entry);
    const files = await (0, fast_glob_1.default)(patterns, { cwd: buildDir, absolute: true });
    await Promise.all(files.map(async (file) => {
        const source = fs.readFileSync(file, 'utf8');
        const lessResult = await less_1.default.render(source, {
            filename: file,
            javascriptEnabled: true,
        });
        const processed = await (0, postcss_1.default)([(0, autoprefixer_1.default)()]).process(lessResult.css, { from: undefined });
        let transformed = processed.css;
        transformed = convertCssVars(transformed);
        transformed = injectCssImports(transformed);
        const outputFile = getOutputPath(file, '.wxss');
        ensureDirectoryExists(outputFile);
        fs.writeFileSync(outputFile, transformed, 'utf8');
    }));
}
async function copyAssets() {
    const patterns = normalizePatterns(config.copyPlugin.entry);
    const files = await (0, fast_glob_1.default)(patterns, { cwd: buildDir, absolute: true });
    await Promise.all(files.map(async (file) => {
        const outputFile = getOutputPath(file, path.extname(file));
        ensureDirectoryExists(outputFile);
        if (/\.json$/i.test(file)) {
            const content = fs.readFileSync(file, 'utf8');
            fs.writeFileSync(outputFile, transformUsingComponents(content, file), 'utf8');
        }
        else {
            fs.copyFileSync(file, outputFile);
        }
    }));
}
const getCommonPlugins = () => {
    return [
        (0, plugin_node_resolve_1.default)({
            mainFields: ['module', 'main', 'jsnext:main', 'browser'],
            extensions,
        }),
        (0, plugin_commonjs_1.default)({
            include: /node_modules/,
        }),
        (0, plugin_typescript_1.default)({ tslib: require('tslib'), typescript: require('typescript'), tsconfig }),
    ];
};
async function compileScripts() {
    const patterns = normalizePatterns(config.entry);
    const inputFiles = await (0, fast_glob_1.default)(patterns, { cwd: buildDir, absolute: true });
    if (!inputFiles.length) {
        return;
    }
    const bundle = await (0, rollup_1.rollup)({
        input: inputFiles,
        external: [/@doraemon-ui/],
        plugins: [...getCommonPlugins()],
        onwarn(warning, warn) {
            if (warning.code === 'THIS_IS_UNDEFINED')
                return;
            // if (warning.message.includes('using named and default exports together')) return
            // if (warning.message.includes('Empty chunk')) return
            warn(warning);
        },
    });
    await bundle.write({
        dir: path.join(buildDir, config.outputDir),
        format: 'esm',
        preserveModules: true,
        preserveModulesRoot: path.join(buildDir, 'src'),
        sourcemap: false,
        banner: util_1.default.banner(),
    });
    await bundle.close();
}
function onBuildStart(opts) {
    console.info(opts.onStartMsg || '正在构建当前组件');
}
function onBuildEnd(opts) {
    console.info(opts.onCloseMsg || '构建完成惹');
}
function onBuildError(err) {
    console.error(err);
}
function debounce(fn, delay = 100) {
    let timer = null;
    return () => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(fn, delay);
    };
}
async function performBuild(opts = {}) {
    onBuildStart(opts);
    await compileScripts();
    await Promise.all([copyAssets(), compileStyles()]);
    onBuildEnd(opts);
}
async function createWatcher(opts = {}) {
    const inputPatterns = normalizePatterns(config.entry);
    const inputFiles = await (0, fast_glob_1.default)(inputPatterns, { cwd: buildDir, absolute: true });
    const watchOptions = {
        input: inputFiles,
        external: [/@doraemon-ui/],
        plugins: [
            ...getCommonPlugins(),
            (0, rollup_plugin_copy_1.default)({
                targets: [
                    {
                        src: normalizePatterns(config.copyPlugin.entry).map((pattern) => path.join(buildDir, pattern)),
                        dest: path.join(buildDir, config.outputDir),
                    },
                ],
                flatten: false,
            }),
        ],
        output: {
            dir: path.join(buildDir, config.outputDir),
            format: 'esm',
            preserveModules: true,
            preserveModulesRoot: path.join(buildDir, 'src'),
            sourcemap: false,
            banner: util_1.default.banner(),
        },
        watch: {
            include: [path.join(buildDir, 'src', '**')],
        },
    };
    const watcher = (0, rollup_1.watch)(watchOptions);
    watcher.on('event', async (event) => {
        if (event.code === 'BUNDLE_START') {
            onBuildStart(opts);
            opts.onListening && opts.onListening('start');
        }
        else if (event.code === 'BUNDLE_END') {
            await Promise.all([copyAssets(), compileStyles()]);
            onBuildEnd(opts);
            opts.onListening && opts.onListening('stop');
        }
        else if (event.code === 'ERROR') {
            onBuildError(event.error);
            opts.onListening && opts.onListening('error');
        }
    });
    const rebuildStyles = debounce(async () => {
        try {
            await compileStyles();
            opts.onListening && opts.onListening('stop');
        }
        catch (error) {
            onBuildError(error);
        }
    });
    const rebuildCopy = debounce(async () => {
        try {
            await copyAssets();
            opts.onListening && opts.onListening('stop');
        }
        catch (error) {
            onBuildError(error);
        }
    });
    chokidar_1.default
        .watch(normalizePatterns(config.cssPlugin.entry), {
        cwd: buildDir,
        ignoreInitial: true,
    })
        .on('all', rebuildStyles);
    chokidar_1.default
        .watch(normalizePatterns(config.copyPlugin.entry), {
        cwd: buildDir,
        ignoreInitial: true,
    })
        .on('all', rebuildCopy);
    return watcher;
}
function rollupBuild(opts = {}) {
    const tasks = Array.isArray(opts._) ? opts._ : typeof opts._ === 'string' ? [opts._] : [];
    const watchMode = tasks.includes('watch');
    if (watchMode) {
        console.info(opts.onStartMsg || '正在启动 Rollup 监听模式');
        compileStyles().catch(onBuildError);
        copyAssets().catch(onBuildError);
        return createWatcher(opts);
    }
    return performBuild(opts).catch(onBuildError);
}
