import * as path from 'path'
import * as fs from 'fs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import copy from 'rollup-plugin-copy'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import type { Plugin as RollupPlugin } from 'rollup'
import util from '../shared/util'

const buildDir = util.buildDir
const rootDir = util.rootDir
const extensions: string[] = ['.js', '.ts']

const tsconfig: string = fs.existsSync(path.join(buildDir, 'tsconfig.json')) ?
  path.join(buildDir, 'tsconfig.json') :
  path.join(rootDir, 'tsconfig.json')

interface FormatConfig {
  sourceMap: boolean
  external: (id: string) => boolean
  plugins: RollupPlugin[]
}

interface CopyTarget {
  src: string
  dest: string
}

const defaultOpts: RollupConfig = {
  bundleDependencies: true,
  internals: [],
  format: 'esm',
  namedExports: {},
  env: {},
}

/**
 * Get rollup config
 *
 * @export
 * @param {RollupConfig} [opts={}]
 * @returns
 */
export function rollupConfig (opts: RollupConfig = {}): { inputOptions: RollupInputOptions; outputOptions: RollupOutOptions } {
  const banner: string = util.banner()
  const packageJSON: { peerDependencies?: Record<string, string>; dependencies?: Record<string, string> } = util.pkg()
  const options: RollupConfig = Object.assign({}, defaultOpts, opts)
  const internals: string[] = options.internals || []
  const peerDependencies: Record<string, string> = packageJSON.peerDependencies || {}
  const dependencies: Record<string, string> = packageJSON.dependencies || {}
  const externalDependencies: string[] = options.bundleDependencies ? Object.keys(peerDependencies) : Object.keys(Object.assign({}, dependencies, peerDependencies))
  const externals = (id: string): boolean => externalDependencies.filter(dep => internals.indexOf(dep) === -1).some(dep => (new RegExp(`^${dep}`)).test(id))
  const input: string = path.join(buildDir, options.entry as string) || path.join(buildDir, 'src/index.ts')
  const outputFile: string = options.outputFile || path.join(buildDir, 'miniprogram_dist/index.js')
  const copyFile: CopyTarget[] = [
    { src: 'src/**/*.json', dest: 'miniprogram_dist' },
    { src: 'src/**/*.wxss', dest: 'miniprogram_dist' },
    { src: 'src/**/*.wxml', dest: 'miniprogram_dist' },
  ]  
  const commonPlugins: RollupPlugin[] = [
    copy({
      targets: Array.isArray(options.copy) ?
        options.copy : options.copy === false ?
          [] : copyFile,
    }),
    nodeResolve({
      mainFields: ['module', 'main', 'jsnext:main', 'browser'],
      extensions,
    }),
    commonjs({
      include: /node_modules/,
    }),
    typescript({
      tslib: require('tslib'),
      typescript: require('typescript'),
      tsconfig,
    }),
  ]
  const specificConfig: { [key: string]: FormatConfig } = {
    'esm': {
      sourceMap: false,
      external: externals,
      plugins: commonPlugins.concat([
        replace({
          preventAssignment: true,
          values: Object.assign({
            'process.env.NODE_ENV': 'process.env.NODE_ENV',
            'process.env.BUILD': JSON.stringify('production'),
          }, options.env),
        }),
      ]),
    },
  }
  const rollupConfig = specificConfig[options.format as 'esm']
  const inputOptions: RollupInputOptions = {
    input,
    // external: rollupConfig.external || [],
    external: [/@doraemon-ui/],
    plugins: rollupConfig.plugins || [],
    inlineDynamicImports: true,
  }
  const outputOptions: RollupOutOptions = {
    file: outputFile,
    format: options.format,
    name: options.libraryName,
    sourcemap: rollupConfig.sourceMap,
    banner,
    exports: 'auto'
  }
  return {
    inputOptions,
    outputOptions,
  }
}

/**
 * 构建配置
 *
 * @export
 * @interface RollupConfig
 */
export interface RollupConfig {
  entry?: string
  outputFile?: string
  format?: 'esm'
  copy?: CopyTarget[] | boolean
  libraryName?: string
  bundleDependencies?: boolean
  internals?: string[]
  namedExports?: Record<string, string[]>
  env?: Record<string, string>
}

/**
 * 入口配置
 *
 * @export
 * @interface RollupInputOptions
 */
export interface RollupInputOptions {
  input?: string
  external?: (string | RegExp)[]
  plugins?: RollupPlugin[]
  inlineDynamicImports?: boolean
}

/**
 * 出口配置
 *
 * @export
 * @interface RollupOutOptions
 */
export interface RollupOutOptions {
  file?: string
  format?: 'esm'
  name?: string
  sourcemap?: boolean
  banner?: string
  exports?: 'default' | 'named' | 'none' | 'auto'
}