import * as path from 'path'
import * as fs from 'fs'
import fg from 'fast-glob'
import chokidar from 'chokidar'
import { rollup, watch as rollupWatch } from 'rollup'
import type { RollupBuild, RollupOptions, RollupWatcher } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import copy from 'rollup-plugin-copy'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import less from 'less'
import cssbeautify from 'cssbeautify'
import csstree from 'css-tree'
import type { Atrule, CssNode, Declaration, ListItem, MediaFeature } from 'css-tree'
import util from '../shared/util'

const buildDir = util.buildDir
const rootDir = util.rootDir
const extensions: string[] = ['.js', '.ts']

const doraConfig = fs.existsSync(path.join(buildDir, 'dora.config.js'))
  ? path.join(buildDir, 'dora.config.js')
  : path.join(rootDir, 'dora.config.js')

const tsconfig = fs.existsSync(path.join(buildDir, 'tsconfig.json'))
  ? path.join(buildDir, 'tsconfig.json')
  : path.join(rootDir, 'tsconfig.json')

export interface CopyPluginConfig {
  entry: string | string[]
}

export interface CssPluginConfig {
  entry: string | string[]
  pxTransform?: {
    designWidth: number
  }
}

export interface DoraConfig {
  entry?: string | string[]
  outputDir?: string
  copyPlugin?: CopyPluginConfig
  cssPlugin?: CssPluginConfig
}

const defaultConfig: Required<DoraConfig> = {
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
}

let userConfig: DoraConfig = {}
if (fs.existsSync(doraConfig)) {
  userConfig = require(doraConfig) as DoraConfig
}
const config: Required<DoraConfig> = Object.assign({}, defaultConfig, userConfig)

interface UsingComponents {
  usingComponents?: Record<string, string>
}

function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function normalizePatterns(patterns: string | string[]): string[] {
  return Array.isArray(patterns) ? patterns : [patterns]
}

function transformUsingComponents(content: string, filePath: string): string {
  const fileDir = path.dirname(filePath)
  const value = JSON.parse(content) as UsingComponents

  if (!value.usingComponents) {
    return content
  }

  const usingComponents: Record<string, string> = {}
  Object.keys(value.usingComponents).forEach((key) => {
    const componentPath = value.usingComponents![key]
    usingComponents[key] = resolveComponentPath(fileDir, componentPath)
  })

  return JSON.stringify(Object.assign({}, value, { usingComponents }), null, 2)
}

interface PackageJSON {
  name: string
}

function resolveComponentPath(base: string, str: string): string {
  const paths = str.split('/')
  let i = paths.length - 1
  let pkg: PackageJSON | undefined

  while (i > 0) {
    const packageJSONPath = path.join(base, paths.slice(0, i).join('/'), 'package.json')
    if (fs.existsSync(packageJSONPath)) {
      pkg = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8')) as PackageJSON
      break
    }
    i--
  }

  return pkg ? `${pkg.name}/${paths[paths.length - 1]}` : str
}

interface ConvertCssVarsOptions {
  bodyNode: string
  rootNode: string
}

interface ColorMapValue {
  value: string
  type?: string
}

function convertCssVars(css: string, options: ConvertCssVarsOptions = { bodyNode: 'page', rootNode: 'root' }): string {
  const colorMap: Record<string, ColorMapValue> = {}
  const ast = csstree.parse(css)

  const checkIsDarkRule = (atrule: Atrule | null): boolean => {
    let isDark = false
    if (!atrule) return false
    csstree.walk(atrule, {
      visit: 'MediaFeature',
      enter(node: MediaFeature) {
        if (node.name === 'prefers-color-scheme' && node.value && node.value.type === 'Identifier' && node.value.name === 'dark') {
          isDark = true
        }
      },
    })
    return isDark
  }

  const checkIsRootTag = (astNode: CssNode | null | undefined, opts: ConvertCssVarsOptions): boolean => {
    let isRoot = false
    if (!astNode) return false
    csstree.walk(astNode, {
      enter(node: CssNode) {
        if (
          (node.type === 'TypeSelector' && node.name === opts.bodyNode) ||
          (node.type === 'PseudoClassSelector' && node.name === opts.rootNode)
        ) {
          isRoot = true
        }
      },
    })
    return isRoot
  }

  const checkIsSingleRoot = (astNode: CssNode | null | undefined, opts: ConvertCssVarsOptions): boolean => {
    let isSingle = false
    if (!astNode) return false
    csstree.walk(astNode, {
      enter(node: CssNode, item: ListItem<CssNode>) {
        if (
          (node.type === 'TypeSelector' && node.name === opts.bodyNode) ||
          (node.type === 'PseudoClassSelector' && node.name === opts.rootNode)
        ) {
          if (!item.prev && !item.next) {
            isSingle = true
          }
        }
      },
    })
    return isSingle
  }

  csstree.walk(ast, {
    visit: 'Declaration',
    enter(this: csstree.WalkContext, node: Declaration, item: ListItem<CssNode>, list: csstree.List<CssNode>) {
      if (node.property && /^--/.test(node.property)) {
        const isMediaDark = checkIsDarkRule(this.atrule as Atrule | null)
        const isRootTag = checkIsRootTag(this.rule?.prelude, options)
        const isSingle = checkIsSingleRoot(this.rule?.prelude, options)

        if (isMediaDark && isRootTag) {
          colorMap[`${node.property}_dark`] = { value: csstree.generate(node.value) }
        } else if (!isMediaDark && isSingle) {
          colorMap[node.property] = { value: csstree.generate(node.value) }
        }
      }
    },
  })

  csstree.walk(ast, (node: CssNode, item: ListItem<CssNode>, list: csstree.List<CssNode>) => {
    if (node.type === 'Declaration') {
      const varNames: string[] = []
      csstree.walk(node, (child: CssNode) => {
        if (child.type === 'Function' && child.name === 'var') {
          csstree.walk(child, (inner: CssNode) => {
            if (inner.type === 'Identifier') {
              varNames.push(inner.name)
            }
          })
        }
      })

      if (varNames.length) {
        let cssStyle = csstree.generate(node)
        for (const name of varNames) {
          if (colorMap[name]) {
            const reg = new RegExp(`var\\(\\s*${name}\\s*\\)`, 'g')
            cssStyle = cssStyle.replace(reg, colorMap[name].value.trim())
          }
        }
        const rule: ListItem<CssNode> = {
          prev: null,
          next: null,
          data: csstree.parse(cssStyle, { context: 'declaration' }),
        }
        list.insert(rule, item)
      }
    }
  })

  return cssbeautify(csstree.generate(ast), {
    indent: '  ',
    openbrace: 'end-of-line',
    autosemicolon: true,
  })
}

function injectCssImports(content: string): string {
  const INJECT_REG = /\/\*! inject:wxss:(.*) \*\//
  const END_INJECT_REG = /\/\*! endinject \*\//
  let result = content
  let startMatch = result.match(INJECT_REG)
  let endMatch = result.match(END_INJECT_REG)

  while (startMatch && endMatch) {
    const startIndex = startMatch.index || 0
    const endIndex = endMatch.index || 0
    result = result.slice(0, startIndex) + `@import '${startMatch[1]}';\n` + result.slice(endIndex + endMatch[0].length)
    startMatch = result.match(INJECT_REG)
    endMatch = result.match(END_INJECT_REG)
  }

  return result
}

function getOutputPath(file: string, ext: string): string {
  const relativePath = path.relative(path.join(buildDir, 'src'), file)
  return path.join(buildDir, config.outputDir, relativePath.replace(/\.(ts|less|json|wxml|wxss)$/, ext))
}

async function compileStyles(): Promise<void> {
  const patterns = normalizePatterns(config.cssPlugin.entry)
  const files = await fg(patterns, { cwd: buildDir, absolute: true })

  await Promise.all(
    files.map(async (file) => {
      const source = fs.readFileSync(file, 'utf8')
      const lessResult = await less.render(source, {
        filename: file,
        javascriptEnabled: true,
      })
      const processed = await postcss([autoprefixer()]).process(lessResult.css, { from: undefined })
      let transformed = processed.css
      transformed = convertCssVars(transformed)
      transformed = injectCssImports(transformed)

      const outputFile = getOutputPath(file, '.wxss')
      ensureDirectoryExists(outputFile)
      fs.writeFileSync(outputFile, transformed, 'utf8')
    }),
  )
}

async function copyAssets(): Promise<void> {
  const patterns = normalizePatterns(config.copyPlugin.entry)
  const files = await fg(patterns, { cwd: buildDir, absolute: true })

  await Promise.all(
    files.map(async (file) => {
      const outputFile = getOutputPath(file, path.extname(file))
      ensureDirectoryExists(outputFile)

      if (/\.json$/i.test(file)) {
        const content = fs.readFileSync(file, 'utf8')
        fs.writeFileSync(outputFile, transformUsingComponents(content, file), 'utf8')
      } else {
        fs.copyFileSync(file, outputFile)
      }
    }),
  )
}

async function compileScripts(): Promise<void> {
  const patterns = normalizePatterns(config.entry)
  const inputFiles = await fg(patterns, { cwd: buildDir, absolute: true })

  if (!inputFiles.length) {
    return
  }

  const bundle = await rollup({
    input: inputFiles,
    plugins: [
      nodeResolve({
        mainFields: ['module', 'main', 'jsnext:main', 'browser'],
        extensions,
      }),
      commonjs({
        include: /node_modules/,
      }),
      typescript({ tslib: require('tslib'), typescript: require('typescript'), tsconfig }),
    ],
    onwarn(warning, warn) {
      if (warning.code === 'THIS_IS_UNDEFINED') return
      // if (warning.message.includes('using named and default exports together')) return
      // if (warning.message.includes('Empty chunk')) return
      warn(warning)
    },
  })

  await bundle.write({
    dir: path.join(buildDir, config.outputDir),
    format: 'esm',
    preserveModules: true,
    preserveModulesRoot: path.join(buildDir, 'src'),
    sourcemap: false,
    banner: util.banner(),
    exports: 'auto',
  })
  await bundle.close()
}

interface ComponentConfig {
  _?: string | string[]
  series?: 'series' | 'parallel'
  onStartMsg?: string
  onCloseMsg?: string
  onListening?: (eventName: 'start' | 'stop' | 'error') => Promise<void>
}

function onBuildStart(opts: ComponentConfig): void {
  console.info(opts.onStartMsg || '正在构建当前组件')
}

function onBuildEnd(opts: ComponentConfig): void {
  console.info(opts.onCloseMsg || '构建完成惹')
}

function onBuildError(err: Error): void {
  console.error(err)
}

function debounce(fn: () => void, delay = 100): () => void {
  let timer: NodeJS.Timeout | null = null
  return () => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(fn, delay)
  }
}

async function performBuild(opts: ComponentConfig = {}): Promise<void> {
  onBuildStart(opts)
  await compileScripts()
  await Promise.all([copyAssets(), compileStyles()])
  onBuildEnd(opts)
}

async function createWatcher(opts: ComponentConfig = {}): Promise<RollupWatcher> {
  const inputPatterns = normalizePatterns(config.entry)
  const inputFiles = await fg(inputPatterns, { cwd: buildDir, absolute: true })

  const watchOptions: RollupOptions = {
    input: inputFiles,
    plugins: [
      nodeResolve({
        mainFields: ['module', 'main', 'jsnext:main', 'browser'],
        extensions,
      }),
      commonjs({
        include: /node_modules/,
      }),
      typescript({ tslib: require('tslib'), typescript: require('typescript'), tsconfig }),
      copy({
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
      banner: util.banner(),
      exports: 'auto',
    },
    watch: {
      include: [path.join(buildDir, 'src', '**')],
    },
  }

  const watcher = rollupWatch(watchOptions)

  watcher.on('event', async (event) => {
    if (event.code === 'BUNDLE_START') {
      onBuildStart(opts)
      opts.onListening && opts.onListening('start')
    } else if (event.code === 'BUNDLE_END') {
      await Promise.all([copyAssets(), compileStyles()])
      onBuildEnd(opts)
      opts.onListening && opts.onListening('stop')
    } else if (event.code === 'ERROR') {
      onBuildError(event.error as unknown as Error)
      opts.onListening && opts.onListening('error')
    }
  })

  const rebuildStyles = debounce(async () => {
    try {
      await compileStyles()
      opts.onListening && opts.onListening('stop')
    } catch (error) {
      onBuildError(error as Error)
    }
  })

  const rebuildCopy = debounce(async () => {
    try {
      await copyAssets()
      opts.onListening && opts.onListening('stop')
    } catch (error) {
      onBuildError(error as Error)
    }
  })

  chokidar
    .watch(normalizePatterns(config.cssPlugin.entry), {
      cwd: buildDir,
      ignoreInitial: true,
    })
    .on('all', rebuildStyles)

  chokidar
    .watch(normalizePatterns(config.copyPlugin.entry), {
      cwd: buildDir,
      ignoreInitial: true,
    })
    .on('all', rebuildCopy)

  return watcher
}

function rollupBuild(opts: ComponentConfig = {}): Promise<RollupBuild | RollupWatcher | void> {
  const tasks = Array.isArray(opts._) ? opts._ : typeof opts._ === 'string' ? [opts._] : []
  const watchMode = tasks.includes('watch')

  if (watchMode) {
    console.info(opts.onStartMsg || '正在启动 Rollup 监听模式')
    compileStyles().catch(onBuildError)
    copyAssets().catch(onBuildError)
    return createWatcher(opts)
  }

  return performBuild(opts).catch(onBuildError)
}

export { rollupBuild as buildComponent }
