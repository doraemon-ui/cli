"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDts = buildDts;
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const chalk_1 = __importDefault(require("chalk"));
const typescript_1 = __importDefault(require("typescript"));
const getDtsConfig_1 = require("./getDtsConfig");
/**
 * Format TypeScript diagnostics into a readable error message.
 *
 * @param {readonly ts.Diagnostic[]} diagnostics
 * @returns {string}
 */
function formatDiagnostics(diagnostics) {
    return typescript_1.default.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => '\n',
    });
}
/**
 * Keep only error-level diagnostics.
 *
 * @param {readonly ts.Diagnostic[]} diagnostics
 * @returns {ts.Diagnostic[]}
 */
function getErrorDiagnostics(diagnostics) {
    return diagnostics.filter((diagnostic) => diagnostic.category === typescript_1.default.DiagnosticCategory.Error);
}
const DEFAULT_OPTIONS = {
    // Ensure ".d.ts" modules are generated
    declaration: true,
    // Skip ".js" generation
    noEmit: false,
    // Emit only declaration files
    emitDeclarationOnly: true,
    // Skip code generation when error occurs
    noEmitOnError: true,
    // Avoid extra work
    checkJs: false,
    // Do not generate declaration maps
    declarationMap: false,
    // Skip library type checking
    skipLibCheck: true,
    // Ensure TS2742 errors are visible
    preserveSymlinks: true,
    // Ensure we can parse the latest code
    target: typescript_1.default.ScriptTarget.ESNext,
    // Use the Bundler module resolution strategy
    moduleResolution: typescript_1.default.ModuleResolutionKind.Bundler,
    // Allows importing `*.json`
    resolveJsonModule: true,
    // Skip type checking
    noCheck: true,
};
/**
 * Emit temporary declaration files from tsconfig.dts.json.
 *
 * @param {string} tsconfig
 * @param {ts.CompilerOptions} [inlineCompilerOptions={}]
 */
function runDeclarationEmit(tsconfig, inlineCompilerOptions = {}) {
    const configFile = typescript_1.default.readConfigFile(tsconfig, typescript_1.default.sys.readFile);
    if (configFile.error) {
        throw new Error(formatDiagnostics([configFile.error]));
    }
    const parsedCommandLine = typescript_1.default.parseJsonConfigFileContent(configFile.config, typescript_1.default.sys, node_path_1.default.dirname(tsconfig), undefined, tsconfig);
    const configErrors = getErrorDiagnostics(parsedCommandLine.errors);
    if (configErrors.length > 0) {
        throw new Error(formatDiagnostics(configErrors));
    }
    const compilerOptions = {
        ...DEFAULT_OPTIONS,
        ...parsedCommandLine.options,
        ...inlineCompilerOptions,
    };
    const program = typescript_1.default.createProgram({
        rootNames: parsedCommandLine.fileNames,
        options: compilerOptions,
        projectReferences: parsedCommandLine.projectReferences,
    });
    const emitResult = program.emit(undefined, undefined, undefined, true);
    const diagnostics = typescript_1.default.sortAndDeduplicateDiagnostics([
        ...getErrorDiagnostics(typescript_1.default.getPreEmitDiagnostics(program)),
        ...getErrorDiagnostics(emitResult.diagnostics),
    ]);
    if (emitResult.emitSkipped || diagnostics.length > 0) {
        throw new Error(formatDiagnostics(diagnostics));
    }
}
/**
 * Resolve a relative declaration specifier to its concrete .d.ts file path.
 *
 * @param {string} specifier
 * @param {string} fromFile
 * @returns {string}
 */
function normalizeModuleSpecifier(specifier, fromFile) {
    const resolved = node_path_1.default.resolve(node_path_1.default.dirname(fromFile), specifier);
    if (resolved.endsWith('.d.ts')) {
        return resolved;
    }
    const fileCandidate = `${resolved}.d.ts`;
    if ((0, node_fs_1.existsSync)(fileCandidate)) {
        return fileCandidate;
    }
    return node_path_1.default.join(resolved, 'index.d.ts');
}
/**
 * Check whether an import/export points to a relative module.
 *
 * @param {(ts.ImportDeclaration | ts.ExportDeclaration)} statement
 * @returns {boolean}
 */
function isRelativeModule(statement) {
    return !!statement.moduleSpecifier && typescript_1.default.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text.startsWith('.');
}
/**
 * Get the relative module specifier text from an import/export declaration.
 *
 * @param {(ts.ImportDeclaration | ts.ExportDeclaration)} statement
 * @returns {(string | null)}
 */
function getRelativeModuleSpecifier(statement) {
    if (!statement.moduleSpecifier || !typescript_1.default.isStringLiteral(statement.moduleSpecifier)) {
        return null;
    }
    return statement.moduleSpecifier.text.startsWith('.') ? statement.moduleSpecifier.text : null;
}
/**
 * Detect the synthetic default export placeholder emitted in declaration output.
 *
 * @param {ts.Statement} statement
 * @returns {boolean}
 */
function isDefaultExportPlaceholder(statement) {
    if (!typescript_1.default.isVariableStatement(statement)) {
        return false;
    }
    if (statement.declarationList.declarations.length !== 1) {
        return false;
    }
    const declaration = statement.declarationList.declarations[0];
    return typescript_1.default.isIdentifier(declaration.name) && declaration.name.text === '_default';
}
/**
 * Collect all declaration files under a directory in stable order.
 *
 * @param {string} dirPath
 * @returns {string[]}
 */
function collectDeclarationFiles(dirPath) {
    const declarationFiles = [];
    for (const entry of (0, node_fs_1.readdirSync)(dirPath)) {
        const entryPath = node_path_1.default.join(dirPath, entry);
        const entryStat = (0, node_fs_1.statSync)(entryPath);
        if (entryStat.isDirectory()) {
            declarationFiles.push(...collectDeclarationFiles(entryPath));
            continue;
        }
        if (entryPath.endsWith('.d.ts')) {
            declarationFiles.push(entryPath);
        }
    }
    return declarationFiles.sort((a, b) => a.localeCompare(b));
}
/**
 * Collect leading triple-slash reference directives from a declaration file.
 *
 * We preserve the original text so bundled output keeps exact `types`, `path`,
 * `lib`, and `preserve` attributes emitted by TypeScript.
 *
 * @param {string} sourceText
 * @returns {string[]}
 */
function collectReferenceDirectives(sourceText) {
    const references = [];
    const lines = sourceText.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }
        if (trimmed.startsWith('/// <reference ') && trimmed.endsWith('/>')) {
            references.push(trimmed);
            continue;
        }
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')) {
            continue;
        }
        break;
    }
    return references;
}
/**
 * Determine whether an import clause is `import type`.
 *
 * TypeScript 6 deprecates `ImportClause.isTypeOnly` in favor of
 * `phaseModifier === SyntaxKind.TypeKeyword`.
 *
 * @param {ts.ImportClause} importClause
 * @returns {boolean}
 */
function isTypeOnlyImportClause(importClause) {
    return importClause.phaseModifier === typescript_1.default.SyntaxKind.TypeKeyword;
}
/**
 * Collect a normalized external import into its module bucket.
 *
 * Named imports from the same module are merged. Other syntaxes are preserved
 * as raw imports to avoid changing semantics for namespace/default imports.
 *
 * @param {Map<string, ImportBucket>} importBuckets
 * @param {ts.ImportDeclaration} statement
 * @param {ts.SourceFile} sourceFile
 */
function collectImportDeclaration(importBuckets, statement, sourceFile) {
    if (!typescript_1.default.isStringLiteral(statement.moduleSpecifier)) {
        return;
    }
    const moduleName = statement.moduleSpecifier.text;
    const bucket = importBuckets.get(moduleName) ?? {
        namedSpecifiers: [],
        rawImports: [],
        sideEffectOnly: false,
    };
    importBuckets.set(moduleName, bucket);
    const { importClause } = statement;
    if (!importClause) {
        bucket.sideEffectOnly = true;
        return;
    }
    if (importClause.name || !importClause.namedBindings || typescript_1.default.isNamespaceImport(importClause.namedBindings)) {
        const rawImport = statement.getFullText(sourceFile).trim();
        if (rawImport && !bucket.rawImports.includes(rawImport)) {
            bucket.rawImports.push(rawImport);
        }
        return;
    }
    for (const element of importClause.namedBindings.elements) {
        const imported = element.propertyName?.text ?? element.name.text;
        const local = element.name.text;
        const isTypeOnly = isTypeOnlyImportClause(importClause) || element.isTypeOnly;
        const exists = bucket.namedSpecifiers.some((specifier) => specifier.imported === imported && specifier.local === local && specifier.isTypeOnly === isTypeOnly);
        if (!exists) {
            bucket.namedSpecifiers.push({
                imported,
                local,
                isTypeOnly,
            });
        }
    }
}
/**
 * Render normalized import buckets back into declaration source text.
 *
 * @param {Map<string, ImportBucket>} importBuckets
 * @returns {string[]}
 */
function renderImportBuckets(importBuckets) {
    const chunks = [];
    for (const [moduleName, bucket] of importBuckets) {
        if (bucket.sideEffectOnly) {
            chunks.push(`import '${moduleName}';`);
        }
        if (bucket.namedSpecifiers.length > 0) {
            const specifiers = bucket.namedSpecifiers
                .slice()
                .sort((left, right) => {
                if (left.imported !== right.imported) {
                    return left.imported.localeCompare(right.imported);
                }
                if (left.local !== right.local) {
                    return left.local.localeCompare(right.local);
                }
                return Number(left.isTypeOnly) - Number(right.isTypeOnly);
            });
            const valueSpecifiers = specifiers
                .filter((specifier) => !specifier.isTypeOnly)
                .map(({ imported, local }) => (imported === local ? imported : `${imported} as ${local}`));
            const typeSpecifiers = specifiers
                .filter((specifier) => specifier.isTypeOnly)
                .map(({ imported, local }) => (imported === local ? imported : `${imported} as ${local}`));
            if (valueSpecifiers.length > 0) {
                chunks.push(`import { ${valueSpecifiers.join(', ')} } from '${moduleName}';`);
            }
            if (typeSpecifiers.length > 0) {
                chunks.push(`import type { ${typeSpecifiers.join(', ')} } from '${moduleName}';`);
            }
        }
        chunks.push(...bucket.rawImports);
    }
    return chunks;
}
/**
 * Rewrite relative inline import types after local modules have been inlined.
 *
 * Example:
 * `typeof import("./core").FastColor` -> `typeof FastColor`
 * `import("./core").SemanticSchema` -> `SemanticSchema`
 *
 * External package imports are preserved.
 *
 * @param {string} sourceText
 * @returns {string}
 */
function rewriteRelativeImportTypes(sourceText) {
    return sourceText
        .replace(/\btypeof\s+import\("(\.\/[^"]+)"\)\.([A-Za-z_$][\w$]*)/g, 'typeof $2')
        .replace(/\bimport\("(\.\/[^"]+)"\)\.([A-Za-z_$][\w$]*)/g, '$2');
}
/**
 * Build a bundled declaration file from emitted temporary .d.ts files.
 *
 * @param {DtsConfig} [options={}]
 * @returns {Promise<void>}
 */
async function buildDts(options = {}) {
    const config = (0, getDtsConfig_1.getDtsConfig)(options);
    const { cleanTempDir, tempDir, entry, outputFile } = config;
    console.log('Powered by tsc');
    try {
        console.log(chalk_1.default.gray(`building ${outputFile}...\n`));
        if (cleanTempDir) {
            await (0, promises_1.rm)(tempDir, { recursive: true, force: true });
        }
        runDeclarationEmit(config.tsconfig, config.compilerOptions);
        if (!(0, node_fs_1.existsSync)(tempDir)) {
            throw new Error(`Missing declaration directory: ${tempDir}.`);
        }
        const visited = new Set();
        const appendedReferenceChunks = new Set();
        const appendedBodyChunks = new Set();
        const referenceChunks = [];
        const bodyChunks = [];
        const importBuckets = new Map();
        /**
         * Append a deduplicated reference directive block.
         *
         * @param {string} text
         */
        function appendReferenceChunk(text) {
            const trimmed = text.trim();
            if (trimmed && !appendedReferenceChunks.has(trimmed)) {
                appendedReferenceChunks.add(trimmed);
                referenceChunks.push(trimmed);
            }
        }
        /**
         * Append a deduplicated declaration body block.
         *
         * @param {string} text
         */
        function appendBodyChunk(text) {
            const trimmed = text.trim();
            if (trimmed && !appendedBodyChunks.has(trimmed)) {
                appendedBodyChunks.add(trimmed);
                bodyChunks.push(trimmed);
            }
        }
        /**
         * Expand one declaration file and merge its reachable statements.
         *
         * @param {string} filePath
         * @param {boolean} allowDefaultExport
         */
        function processFile(filePath, allowDefaultExport) {
            const normalizedPath = node_path_1.default.normalize(filePath);
            if (visited.has(normalizedPath)) {
                return;
            }
            visited.add(normalizedPath);
            const sourceText = (0, node_fs_1.readFileSync)(normalizedPath, 'utf8');
            const sourceFile = typescript_1.default.createSourceFile(normalizedPath, sourceText, typescript_1.default.ScriptTarget.Latest, true, typescript_1.default.ScriptKind.TS);
            collectReferenceDirectives(sourceText).forEach(appendReferenceChunk);
            for (const statement of sourceFile.statements) {
                if (typescript_1.default.isImportDeclaration(statement) || typescript_1.default.isExportDeclaration(statement)) {
                    const relativeSpecifier = getRelativeModuleSpecifier(statement);
                    if (relativeSpecifier) {
                        processFile(normalizeModuleSpecifier(relativeSpecifier, normalizedPath), false);
                    }
                }
            }
            for (const statement of sourceFile.statements) {
                if (!allowDefaultExport && isDefaultExportPlaceholder(statement)) {
                    continue;
                }
                if (typescript_1.default.isImportDeclaration(statement)) {
                    if (!isRelativeModule(statement)) {
                        collectImportDeclaration(importBuckets, statement, sourceFile);
                    }
                    continue;
                }
                if (typescript_1.default.isExportDeclaration(statement)) {
                    if (statement.exportClause && typescript_1.default.isNamedExports(statement.exportClause) && statement.exportClause.elements.length === 0) {
                        continue;
                    }
                    if (!statement.moduleSpecifier) {
                        appendBodyChunk(statement.getFullText(sourceFile));
                    }
                    continue;
                }
                if (typescript_1.default.isExportAssignment(statement)) {
                    if (!allowDefaultExport) {
                        continue;
                    }
                    appendBodyChunk(statement.getFullText(sourceFile));
                    continue;
                }
                if (typescript_1.default.isEmptyStatement(statement)) {
                    continue;
                }
                const text = statement.getFullText(sourceFile).trim();
                if (text === 'export {};') {
                    continue;
                }
                appendBodyChunk(statement.getFullText(sourceFile));
            }
        }
        const declarationFiles = collectDeclarationFiles(tempDir);
        if ((0, node_fs_1.existsSync)(entry)) {
            processFile(entry, true);
        }
        for (const declarationFile of declarationFiles) {
            if (node_path_1.default.normalize(declarationFile) === node_path_1.default.normalize(entry)) {
                continue;
            }
            processFile(declarationFile, false);
        }
        const importChunks = renderImportBuckets(importBuckets);
        const sections = [referenceChunks.join('\n'), importChunks.join('\n\n'), bodyChunks.join('\n\n')].filter(Boolean);
        const bundledSourceText = rewriteRelativeImportTypes(`${sections.join('\n\n')}\n`);
        await (0, promises_1.mkdir)(node_path_1.default.dirname(outputFile), { recursive: true });
        await (0, promises_1.writeFile)(outputFile, bundledSourceText);
        console.log(chalk_1.default.cyan('Building complete\n'));
    }
    catch (err) {
        console.error(chalk_1.default.red(err));
        throw err;
    }
    finally {
        if (cleanTempDir) {
            await (0, promises_1.rm)(tempDir, { recursive: true, force: true });
        }
    }
}
