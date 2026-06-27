import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
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
 * Collect leading triple-slash reference directives from a declaration file.
 *
 * We preserve the original text so bundled output keeps exact `types`, `path`,
 * `lib`, and `preserve` attributes emitted by TypeScript.
 *
 * @param {string} sourceText
 * @returns {string[]}
 */
function collectReferenceDirectives(sourceText: string): string[] {
  const references: string[] = []
  const lines = sourceText.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      continue
    }

    if (trimmed.startsWith('/// <reference ') && trimmed.endsWith('/>')) {
      references.push(trimmed)
      continue
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('*/')) {
      continue
    }

    break
  }

  return references
}

interface ImportSpecifierRecord {
  imported: string
  local: string
  isTypeOnly: boolean
}

interface ImportBucket {
  namedSpecifiers: ImportSpecifierRecord[]
  rawImports: string[]
  sideEffectOnly: boolean
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
function isTypeOnlyImportClause(importClause: ts.ImportClause): boolean {
  return importClause.phaseModifier === ts.SyntaxKind.TypeKeyword
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
function collectImportDeclaration(
  importBuckets: Map<string, ImportBucket>,
  statement: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
): void {
  if (!ts.isStringLiteral(statement.moduleSpecifier)) {
    return
  }

  const moduleName = statement.moduleSpecifier.text
  const bucket = importBuckets.get(moduleName) ?? {
    namedSpecifiers: [],
    rawImports: [],
    sideEffectOnly: false,
  }
  importBuckets.set(moduleName, bucket)

  const { importClause } = statement
  if (!importClause) {
    bucket.sideEffectOnly = true
    return
  }

  if (importClause.name || !importClause.namedBindings || ts.isNamespaceImport(importClause.namedBindings)) {
    const rawImport = statement.getFullText(sourceFile).trim()
    if (rawImport && !bucket.rawImports.includes(rawImport)) {
      bucket.rawImports.push(rawImport)
    }
    return
  }

  for (const element of importClause.namedBindings.elements) {
    const imported = element.propertyName?.text ?? element.name.text
    const local = element.name.text
    const isTypeOnly = isTypeOnlyImportClause(importClause) || element.isTypeOnly
    const exists = bucket.namedSpecifiers.some(
      (specifier) =>
        specifier.imported === imported && specifier.local === local && specifier.isTypeOnly === isTypeOnly,
    )

    if (!exists) {
      bucket.namedSpecifiers.push({
        imported,
        local,
        isTypeOnly,
      })
    }
  }
}

/**
 * Render normalized import buckets back into declaration source text.
 *
 * @param {Map<string, ImportBucket>} importBuckets
 * @returns {string[]}
 */
function renderImportBuckets(importBuckets: Map<string, ImportBucket>): string[] {
  const chunks: string[] = []

  for (const [moduleName, bucket] of importBuckets) {
    if (bucket.sideEffectOnly) {
      chunks.push(`import '${moduleName}';`)
    }

    if (bucket.namedSpecifiers.length > 0) {
      const specifiers = bucket.namedSpecifiers
        .slice()
        .sort((left, right) => {
          if (left.imported !== right.imported) {
            return left.imported.localeCompare(right.imported)
          }
          if (left.local !== right.local) {
            return left.local.localeCompare(right.local)
          }
          return Number(left.isTypeOnly) - Number(right.isTypeOnly)
        })
      const valueSpecifiers = specifiers
        .filter((specifier) => !specifier.isTypeOnly)
        .map(({ imported, local }) => (imported === local ? imported : `${imported} as ${local}`))
      const typeSpecifiers = specifiers
        .filter((specifier) => specifier.isTypeOnly)
        .map(({ imported, local }) => (imported === local ? imported : `${imported} as ${local}`))

      if (valueSpecifiers.length > 0) {
        chunks.push(`import { ${valueSpecifiers.join(', ')} } from '${moduleName}';`)
      }

      if (typeSpecifiers.length > 0) {
        chunks.push(`import type { ${typeSpecifiers.join(', ')} } from '${moduleName}';`)
      }
    }

    chunks.push(...bucket.rawImports)
  }

  return chunks
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
function rewriteRelativeImportTypes(sourceText: string): string {
  return sourceText
    .replace(/\btypeof\s+import\("(\.\/[^"]+)"\)\.([A-Za-z_$][\w$]*)/g, 'typeof $2')
    .replace(/\bimport\("(\.\/[^"]+)"\)\.([A-Za-z_$][\w$]*)/g, '$2')
}

/**
 * Build a bundled declaration file from emitted temporary .d.ts files.
 *
 * @param {DtsConfig} [options={}]
 * @returns {Promise<void>}
 */
async function buildDts(options: DtsConfig = {}): Promise<void> {
  const config = getDtsConfig(options)
  const { cleanTempDir, tempDir, entry, outputFile } = config

  console.log('Powered by tsc')
  try {
    console.log(chalk.gray(`building ${outputFile}...\n`))

    if (cleanTempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }

    runDeclarationEmit(config.tsconfig, config.compilerOptions)

    if (!existsSync(tempDir)) {
      throw new Error(`Missing declaration directory: ${tempDir}.`)
    }

    const visited = new Set<string>()
    const appendedReferenceChunks = new Set<string>()
    const appendedBodyChunks = new Set<string>()
    const referenceChunks: string[] = []
    const bodyChunks: string[] = []
    const importBuckets = new Map<string, ImportBucket>()

    /**
     * Append a deduplicated reference directive block.
     *
     * @param {string} text
     */
    function appendReferenceChunk(text: string): void {
      const trimmed = text.trim()
      if (trimmed && !appendedReferenceChunks.has(trimmed)) {
        appendedReferenceChunks.add(trimmed)
        referenceChunks.push(trimmed)
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
      collectReferenceDirectives(sourceText).forEach(appendReferenceChunk)

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
            collectImportDeclaration(importBuckets, statement, sourceFile)
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

    const importChunks = renderImportBuckets(importBuckets)
    const sections = [referenceChunks.join('\n'), importChunks.join('\n\n'), bodyChunks.join('\n\n')].filter(Boolean)
    const bundledSourceText = rewriteRelativeImportTypes(`${sections.join('\n\n')}\n`)
    await mkdir(path.dirname(outputFile), { recursive: true })
    await writeFile(outputFile, bundledSourceText)
    console.log(chalk.cyan('Building complete\n'))
  } catch (err) {
    console.error(chalk.red(err))
    throw err
  } finally {
    if (cleanTempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  }
}

export { buildDts }
