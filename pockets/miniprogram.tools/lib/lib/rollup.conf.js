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
exports.rollupConfig = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const plugin_node_resolve_1 = require("@rollup/plugin-node-resolve");
const rollup_plugin_copy_1 = __importDefault(require("rollup-plugin-copy"));
const plugin_replace_1 = __importDefault(require("@rollup/plugin-replace"));
const plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
const plugin_typescript_1 = __importDefault(require("@rollup/plugin-typescript"));
const util_1 = __importDefault(require("../shared/util"));
const buildDir = util_1.default.buildDir;
const rootDir = util_1.default.rootDir;
const extensions = ['.js', '.ts'];
const tsconfig = fs.existsSync(path.join(buildDir, 'tsconfig.json')) ?
    path.join(buildDir, 'tsconfig.json') :
    path.join(rootDir, 'tsconfig.json');
const defaultOpts = {
    bundleDependencies: true,
    internals: [],
    format: 'esm',
    namedExports: {},
    env: {},
};
/**
 * Get rollup config
 *
 * @export
 * @param {RollupConfig} [opts={}]
 * @returns
 */
function rollupConfig(opts = {}) {
    const banner = util_1.default.banner();
    const packageJSON = util_1.default.pkg();
    const options = Object.assign({}, defaultOpts, opts);
    const peerDependencies = packageJSON.peerDependencies || {};
    const dependencies = packageJSON.dependencies || {};
    const externalDependencies = options.bundleDependencies ? Object.keys(peerDependencies) : Object.keys(Object.assign({}, dependencies, peerDependencies));
    const externals = id => externalDependencies.filter(dep => options.internals.indexOf(dep) === -1).some(dep => (new RegExp(`^${dep}`)).test(id));
    const input = path.join(buildDir, options.entry) || path.join(buildDir, 'src/index.ts');
    const outputFile = options.outputFile || path.join(buildDir, 'miniprogram_dist/index.js');
    const copyFile = [
        { src: 'src/**/*.json', dest: 'miniprogram_dist' },
        { src: 'src/**/*.wxss', dest: 'miniprogram_dist' },
        { src: 'src/**/*.wxml', dest: 'miniprogram_dist' },
    ];
    const commonPlugins = [
        rollup_plugin_copy_1.default({
            targets: Array.isArray(options.copy) ?
                options.copy : options.copy === false ?
                [] : copyFile,
        }),
        plugin_node_resolve_1.nodeResolve({
            mainFields: ['module', 'main', 'jsnext:main', 'browser'],
            extensions,
        }),
        plugin_commonjs_1.default({
            include: /node_modules/,
        }),
        plugin_typescript_1.default({
            tslib: require('tslib'),
            typescript: require('typescript'),
            tsconfig,
        }),
    ];
    const specificConfig = {
        'esm': {
            sourceMap: false,
            external: externals,
            plugins: commonPlugins.concat([
                plugin_replace_1.default({
                    preventAssignment: true,
                    values: Object.assign({
                        'process.env.NODE_ENV': 'process.env.NODE_ENV',
                        'process.env.BUILD': JSON.stringify('production'),
                    }, options.env),
                }),
            ]),
        },
    };
    const rollupConfig = specificConfig[options.format];
    const inputOptions = {
        input,
        // external: rollupConfig.external || [],
        external: [/@doraemon-ui/],
        plugins: rollupConfig.plugins || [],
        inlineDynamicImports: true,
    };
    const outputOptions = {
        file: outputFile,
        format: options.format,
        name: options.libraryName,
        sourcemap: rollupConfig.sourceMap,
        banner,
    };
    return {
        inputOptions,
        outputOptions,
    };
}
exports.rollupConfig = rollupConfig;
