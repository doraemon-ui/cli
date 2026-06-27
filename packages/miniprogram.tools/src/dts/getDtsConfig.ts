import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import util from '../shared/util'

const buildDir = util.buildDir
const rootDir = util.rootDir

const tsconfig = fs.existsSync(path.join(buildDir, 'tsconfig.dts.json'))
  ? path.join(buildDir, 'tsconfig.dts.json')
  : path.join(rootDir, 'tsconfig.dts.json')

const defaultOutputFile = path.join(buildDir, 'index.d.ts')

export interface DtsConfig {
  /**
   * Entry declaration file used as the primary expansion root (default: <tsconfig.outDir>/index.d.ts)
   */
  entry?: string
  /**
   * Output path for the bundled declaration file (default: <buildDir>/index.d.ts)
   */
  outputFile?: string
  /**
   * Path to tsconfig.dts.json (default: finds nearest tsconfig.dts.json)
   */
  tsconfig?: string
  /**
   * TypeScript compiler options (e.g., for path mapping).
   */
  compilerOptions?: ts.CompilerOptions
  /**
   * Directory for emitted temporary declaration files (default: resolved from <tsconfig.outDir>)
   */
  tempDir?: string
  /**
   * Remove the temporary declaration directory before and after bundling.
   */
  cleanTempDir?: boolean
}

/**
 * Resolve the effective temporary declaration directory from tsconfig outDir.
 *
 * @param {string} tsconfigPath
 * @param {ts.CompilerOptions} [compilerOptions={}]
 * @returns {string}
 */
function getTempDir(tsconfigPath: string, compilerOptions: ts.CompilerOptions = {}): string {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile)

  if (configFile.error) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext([configFile.error], {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => '\n',
      }),
    )
  }

  const parsedCommandLine = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsconfigPath), undefined, tsconfigPath)
  const outDir = compilerOptions.outDir ?? parsedCommandLine.options.outDir

  if (!outDir) {
    throw new Error(`Missing compilerOptions.outDir in ${tsconfigPath}.`)
  }

  return path.resolve(outDir)
}

function getDtsConfig(options: Partial<Omit<DtsConfig, 'tempDir'>> = {}): Required<DtsConfig> {
  const tsconfigPath = options.tsconfig ?? tsconfig
  const compilerOptions = options.compilerOptions ?? {}
  const tempDir = getTempDir(tsconfigPath, compilerOptions)

  return {
    cleanTempDir: options.cleanTempDir ?? true,
    entry: options.entry ?? path.join(tempDir, 'index.d.ts'),
    compilerOptions,
    outputFile: options.outputFile ?? defaultOutputFile,
    tsconfig: tsconfigPath,
    tempDir,
  }
}

export { getDtsConfig }
