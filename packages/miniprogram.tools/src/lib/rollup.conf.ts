import * as path from 'path'
import * as fs from 'fs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import copy from 'rollup-plugin-copy'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import util from '../shared/util'

const buildDir = util.buildDir
const rootDir = util.rootDir
const extensions = ['.js', '.ts']

const tsconfig = fs.existsSync(path.join(buildDir, 'tsconfig.json')) ?
  path.join(buildDir, 'tsconfig.json') :
  path.join(rootDir, 'tsconfig.json')

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
export function rollupConfig (opts: RollupConfig = {}) {
  const banner = util.banner()
  const packageJSON = util.pkg()
  const options: RollupConfig = Object.assign({}, defaultOpts, opts)
  const internals = options.internals || []
  const peerDependencies = packageJSON.peerDependencies || {}
  const dependencies = packageJSON.dependencies || {}
  const externalDependencies = options.bundleDependencies ? Object.keys(peerDependencies) : Object.keys(Object.assign({}, dependencies, peerDependencies))
  const externals = id => externalDependencies.filter(dep => internals.indexOf(dep) === -1).some(dep => (new RegExp(`^${dep}`)).test(id))
  const input = path.join(buildDir, options.entry as string) || path.join(buildDir, 'src/index.ts')
  const outputFile = options.outputFile || path.join(buildDir, 'miniprogram_dist/index.js')
  const copyFile = [
    { src: 'src/**/*.json', dest: 'miniprogram_dist' },
    { src: 'src/**/*.wxss', dest: 'miniprogram_dist' },
    { src: 'src/**/*.wxml', dest: 'miniprogram_dist' },
  ]  
  const commonPlugins = [
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
  const specificConfig = {
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
  copy?: any[] | boolean
  libraryName?: string
  bundleDependencies?: boolean
  internals?: any[]
  namedExports?: { [key: string]: any }
  env?: { [key: string]: any }
}

/**
 * 入口配置
 *
 * @export
 * @interface RollupInputOptions
 */
export interface RollupInputOptions {
  input?: string
  external?: any[]
  plugins?: any[]
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
}