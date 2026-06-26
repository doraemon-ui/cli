import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import chalk from 'chalk'
import ts from 'typescript'
import { DtsConfig, getDtsConfig } from './getDtsConfig'

/**
 * Format TypeScript diagnostics into a readable error message.
 *
 * @param {readonly ts.Diagnostic[]} diagnostics
 * @returns {string}
 */
function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string {
  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  })
}

/**
 * Keep only error-level diagnostics.
 *
 * @param {readonly ts.Diagnostic[]} diagnostics
 * @returns {ts.Diagnostic[]}
 */
function getErrorDiagnostics(diagnostics: readonly ts.Diagnostic[]): ts.Diagnostic[] {
  return diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
}

const DEFAULT_OPTIONS: ts.CompilerOptions = {
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
  target: ts.ScriptTarget.ESNext,
  // Use the Bundler module resolution strategy
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  // Allows importing `*.json`
  resolveJsonModule: true,
  // Skip type checking
  noCheck: true,
}

/**
 * Emit temporary declaration files from tsconfig.dts.json.
 *
 * @param {string} tsconfig
 * @param {ts.CompilerOptions} [inlineCompilerOptions={}]
 */
function runDeclarationEmit(tsconfig: string, inlineCompilerOptions: ts.CompilerOptions = {}): void {
  const configFile = ts.readConfigFile(tsconfig, ts.sys.readFile)

  if (configFile.error) {
    throw new Error(formatDiagnostics([configFile.error]))
  }

  const parsedCommandLine = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsconfig), undefined, tsconfig)

  const configErrors = getErrorDiagnostics(parsedCommandLine.errors)
  if (configErrors.length > 0) {
    throw new Error(formatDiagnostics(configErrors))
  }

  const compilerOptions: ts.CompilerOptions = {
    ...DEFAULT_OPTIONS,
    ...parsedCommandLine.options,
    ...inlineCompilerOptions,
  }

  const program = ts.createProgram({
    rootNames: parsedCommandLine.fileNames,
    options: compilerOptions,
    projectReferences: parsedCommandLine.projectReferences,
  })

  const emitResult = program.emit(undefined, undefined, undefined, true)
  const diagnostics = ts.sortAndDeduplicateDiagnostics([
    ...getErrorDiagnostics(ts.getPreEmitDiagnostics(program)),
    ...getErrorDiagnostics(emitResult.diagnostics),
  ])

  if (emitResult.emitSkipped || diagnostics.length > 0) {
    throw new Error(formatDiagnostics(diagnostics))
  }
}

/**
 * Resolve a relative declaration specifier to its concrete .d.ts file path.
 *
 * @param {string} specifier
 * @param {string} fromFile
 * @returns {string}
 */
function normalizeModuleSpecifier(specifier: string, fromFile: string): string {
  const resolved = path.resolve(path.dirname(fromFile), specifier)
  if (resolved.endsWith('.d.ts')) {
    return resolved
  }

  const fileCandidate = `${resolved}.d.ts`
  if (existsSync(fileCandidate)) {
    return fileCandidate
  }

  return path.join(resolved, 'index.d.ts')
}

/**
 * Check whether an import/export points to a relative module.
 *
 * @param {(ts.ImportDeclaration | ts.ExportDeclaration)} statement
 * @returns {boolean}
 */
function isRelativeModule(statement: ts.ImportDeclaration | ts.ExportDeclaration): boolean {
  return !!statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text.startsWith('.')
}

/**
 * Get the relative module specifier text from an import/export declaration.
 *
 * @param {(ts.ImportDeclaration | ts.ExportDeclaration)} statement
 * @returns {(string | null)}
 */
function getRelativeModuleSpecifier(statement: ts.ImportDeclaration | ts.ExportDeclaration): string | null {
  if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) {
    return null
  }

  return statement.moduleSpecifier.text.startsWith('.') ? statement.moduleSpecifier.text : null
}

/**
 * Detect the synthetic default export placeholder emitted in declaration output.
 *
 * @param {ts.Statement} statement
 * @returns {boolean}
 */
function isDefaultExportPlaceholder(statement: ts.Statement): boolean {
  if (!ts.isVariableStatement(statement)) {
    return false
  }

  if (statement.declarationList.declarations.length !== 1) {
    return false
  }

  const declaration = statement.declarationList.declarations[0]
  return ts.isIdentifier(declaration.name) && declaration.name.text === '_default'
}

/**
 * Collect all declaration files under a directory in stable order.
 *
 * @param {string} dirPath
 * @returns {string[]}
 */
function collectDeclarationFiles(dirPath: string): string[] {
  const declarationFiles: string[] = []

  for (const entry of readdirSync(dirPath)) {
    const entryPath = path.join(dirPath, entry)
    const entryStat = statSync(entryPath)

    if (entryStat.isDirectory()) {
      declarationFiles.push(...collectDeclarationFiles(entryPath))
      continue
    }

    if (entryPath.endsWith('.d.ts')) {
      declarationFiles.push(entryPath)
    }
  }

  return declarationFiles.sort((a, b) => a.localeCompare(b))
}

/**
 * Build a bundled declaration file from emitted temporary .d.ts files.
 *
 * @param {DtsConfig} [options={}]
 * @returns {Promise<void>}
 */
async function buildDts(options: DtsConfig = {}): Promise<void> {
  const config = getDtsConfig(options)
  const { tempDir, entry, outputFile } = config

  console.log('Powered by tsc')
  try {
    console.log(chalk.gray(`building ${outputFile}...\n`))

    runDeclarationEmit(config.tsconfig, config.compilerOptions)

    if (!existsSync(tempDir)) {
      throw new Error(`Missing declaration directory: ${tempDir}.`)
    }

    const visited = new Set<string>()
    const appendedImportChunks = new Set<string>()
    const appendedBodyChunks = new Set<string>()
    const importChunks: string[] = []
    const bodyChunks: string[] = []

    /**
     * Append a deduplicated external import block.
     *
     * @param {string} text
     */
    function appendImportChunk(text: string): void {
      const trimmed = text.trim()
      if (trimmed && !appendedImportChunks.has(trimmed)) {
        appendedImportChunks.add(trimmed)
        importChunks.push(trimmed)
      }
    }

    /**
     * Append a deduplicated declaration body block.
     *
     * @param {string} text
     */
    function appendBodyChunk(text: string): void {
      const trimmed = text.trim()
      if (trimmed && !appendedBodyChunks.has(trimmed)) {
        appendedBodyChunks.add(trimmed)
        bodyChunks.push(trimmed)
      }
    }

    /**
     * Expand one declaration file and merge its reachable statements.
     *
     * @param {string} filePath
     * @param {boolean} allowDefaultExport
     */
    function processFile(filePath: string, allowDefaultExport: boolean): void {
      const normalizedPath = path.normalize(filePath)
      if (visited.has(normalizedPath)) {
        return
      }
      visited.add(normalizedPath)

      const sourceText = readFileSync(normalizedPath, 'utf8')
      const sourceFile = ts.createSourceFile(normalizedPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

      for (const statement of sourceFile.statements) {
        if (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) {
          const relativeSpecifier = getRelativeModuleSpecifier(statement)
          if (relativeSpecifier) {
            processFile(normalizeModuleSpecifier(relativeSpecifier, normalizedPath), false)
          }
        }
      }

      for (const statement of sourceFile.statements) {
        if (!allowDefaultExport && isDefaultExportPlaceholder(statement)) {
          continue
        }

        if (ts.isImportDeclaration(statement)) {
          if (!isRelativeModule(statement)) {
            appendImportChunk(statement.getFullText(sourceFile))
          }
          continue
        }

        if (ts.isExportDeclaration(statement)) {
          if (statement.exportClause && ts.isNamedExports(statement.exportClause) && statement.exportClause.elements.length === 0) {
            continue
          }

          if (!statement.moduleSpecifier) {
            appendBodyChunk(statement.getFullText(sourceFile))
          }
          continue
        }

        if (ts.isExportAssignment(statement)) {
          if (!allowDefaultExport) {
            continue
          }
          appendBodyChunk(statement.getFullText(sourceFile))
          continue
        }

        if (ts.isEmptyStatement(statement)) {
          continue
        }

        const text = statement.getFullText(sourceFile).trim()
        if (text === 'export {};') {
          continue
        }

        appendBodyChunk(statement.getFullText(sourceFile))
      }
    }

    const declarationFiles = collectDeclarationFiles(tempDir)

    if (existsSync(entry)) {
      processFile(entry, true)
    }

    for (const declarationFile of declarationFiles) {
      if (path.normalize(declarationFile) === path.normalize(entry)) {
        continue
      }
      processFile(declarationFile, false)
    }

    const sections = [importChunks.join('\n\n'), bodyChunks.join('\n\n')].filter(Boolean)
    await mkdir(path.dirname(outputFile), { recursive: true })
    await writeFile(outputFile, `${sections.join('\n\n')}\n`)
    console.log(chalk.cyan('Building complete\n'))
  } catch (err) {
    console.error(chalk.red(err))
    throw err
  }
}

export { buildDts }
