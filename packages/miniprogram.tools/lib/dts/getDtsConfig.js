"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDtsConfig = getDtsConfig;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const typescript_1 = __importDefault(require("typescript"));
const util_1 = __importDefault(require("../shared/util"));
const buildDir = util_1.default.buildDir;
const rootDir = util_1.default.rootDir;
const tsconfig = node_fs_1.default.existsSync(node_path_1.default.join(buildDir, 'tsconfig.dts.json'))
    ? node_path_1.default.join(buildDir, 'tsconfig.dts.json')
    : node_path_1.default.join(rootDir, 'tsconfig.dts.json');
const defaultOutputFile = node_path_1.default.join(buildDir, 'index.d.ts');
/**
 * Resolve the effective temporary declaration directory from tsconfig outDir.
 *
 * @param {string} tsconfigPath
 * @param {ts.CompilerOptions} [compilerOptions={}]
 * @returns {string}
 */
function getTempDir(tsconfigPath, compilerOptions = {}) {
    const configFile = typescript_1.default.readConfigFile(tsconfigPath, typescript_1.default.sys.readFile);
    if (configFile.error) {
        throw new Error(typescript_1.default.formatDiagnosticsWithColorAndContext([configFile.error], {
            getCanonicalFileName: (fileName) => fileName,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => '\n',
        }));
    }
    const parsedCommandLine = typescript_1.default.parseJsonConfigFileContent(configFile.config, typescript_1.default.sys, node_path_1.default.dirname(tsconfigPath), undefined, tsconfigPath);
    const outDir = compilerOptions.outDir ?? parsedCommandLine.options.outDir;
    if (!outDir) {
        throw new Error(`Missing compilerOptions.outDir in ${tsconfigPath}.`);
    }
    return node_path_1.default.resolve(outDir);
}
function getDtsConfig(options = {}) {
    const tsconfigPath = options.tsconfig ?? tsconfig;
    const compilerOptions = options.compilerOptions ?? {};
    const tempDir = getTempDir(tsconfigPath, compilerOptions);
    return {
        cleanTempDir: options.cleanTempDir ?? true,
        entry: options.entry ?? node_path_1.default.join(tempDir, 'index.d.ts'),
        compilerOptions,
        outputFile: options.outputFile ?? defaultOutputFile,
        tsconfig: tsconfigPath,
        tempDir,
    };
}
