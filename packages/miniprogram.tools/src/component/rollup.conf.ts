import * as path from 'path'
import * as fs from 'fs'
import fg from 'fast-glob'
import chokidar from 'chokidar'
import { rollup, watch as rollupWatch } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import copyPlugin from 'rollup-plugin-copy'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'
import less from 'less'
import cssbeautify from 'cssbeautify'
import csstree from 'css-tree'
import util from '../shared/util'

const buildDir = util.buildDir
const rootDir = util.rootDir

const doraConfig = fs.existsSync(path.join(buildDir, 'dora.config.js'))
  ? path.join(buildDir, 'dora.config.js')
  : path.join(rootDir, 'dora.config.js')

const tsconfig = fs.existsSync(path.join(buildDir, 'tsconfig.json'))
  ? path.join(buildDir, 'tsconfig.json')
  : path.join(rootDir, 'tsconfig.json')

const defaultConfig = {
  entry: ['./src/**/*.ts'],
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

const config = Object.assign({}, defaultConfig, fs.existsSync(doraConfig) ? require(doraConfig) : {})

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function normalizePatterns(patterns: string[] | string) {
  return Array.isArray(patterns) ? patterns : [patterns]
}

function transformUsingComponents(content: string, filePath: string): string {
  const fileDir = path.dirname(filePath)
  const value = JSON.parse(content)

  if (!value.usingComponents) {
    return content
  }

  const usingComponents: Record<string, any> = {}
  Object.keys(value.usingComponents).forEach((key) => {
    const componentPath = value.usingComponents[key]
    usingComponents[key] = resolveComponentPath(fileDir, componentPath)
  })

  return JSON.stringify(Object.assign({}, value, { usingComponents }), null, 2)
}

function resolveComponentPath(base: string, str: string) {
  const paths = str.split('/')
  let i = paths.length - 1
  let pkg: Record<string, any> | undefined

  while (i) {
    const packageJSONPath = path.join(base, paths.slice(0, i).join('/'), 'package.json')
    if (fs.existsSync(packageJSONPath)) {
      pkg = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'))
      break
    }
    i--
  }

  return pkg ? `${pkg.name}/${paths[paths.length - 1]}` : str
}

function convertCssVars(css: string, options = { bodyNode: 'body', rootNode: 'root' }) {
  const colorMap: Record<string, any> = {}
  const ast = csstree.parse(css)

  const checkIsDarkRule = (atrule: any) => {
    let isDark = false
    if (!atrule) return false
    csstree.walk(atrule, (node) => {
      if (node.type === 'MediaFeature' && node.name === 'prefers-color-scheme' && node.value.name === 'dark') {
        isDark = true
      }
    })
    return isDark
  }

  const checkIsRootTag = (astNode: any, opts: any) => {
    let isRoot = false
    if (!astNode) return false
    csstree.walk(astNode, (node) => {
      if (
        (node.type === 'TypeSelector' && node.name === opts.bodyNode) ||
        (node.type === 'PseudoClassSelector' && node.name === opts.rootNode)
      ) {
        isRoot = true
      }
    })
    return isRoot
  }

  const checkIsSingleRoot = (astNode: any, opts: any) => {
    let isSingle = false
    if (!astNode) return false
    csstree.walk(astNode, {
      enter(node, item) {
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
    enter(node, item, list) {
      if (node.property && /^--/.test(node.property)) {
        const isMediaDark = checkIsDarkRule(this.atrule)
        const isRootTag = checkIsRootTag(this.rule?.prelude, options)
        const isSingle = checkIsSingleRoot(this.rule?.prelude, options)

        if (isMediaDark && isRootTag) {
          colorMap[`${node.property}_dark`] = node.value
        } else if (!isMediaDark && isSingle) {
          colorMap[node.property] = node.value
        }
      }
    },
  })

  csstree.walk(ast, (node, item, list) => {
    if (node.type === 'Declaration') {
      const varNames: string[] = []
      csstree.walk(node, (child) => {
        if (child.type === 'Function' && child.name === 'var') {
          let varName = ''
          csstree.walk(child, (inner) => {
            if (inner.type === 'Identifier') {
              varName = inner.name
              varNames.push(varName)
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
        const rule = {
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

function injectCssImports(content: string) {
  const INJECT_REG = /\/\*! inject:wxss:(.*) \*\//
  const END_INJECT_REG = /\/\*! endinject \*\//
  let result = content
  let startMatch = result.match(INJECT_REG)
  let endMatch = result.match(END_INJECT_REG)

  while (startMatch && endMatch) {
    const startIndex = startMatch.index || 0
    const endIndex = endMatch.index || 0
    const injected = result.slice(startIndex + startMatch[0].length, endIndex)
    result = result.slice(0, startIndex) + `@import '${startMatch[1]}';\n` + result.slice(endIndex + endMatch[0].length)
    startMatch = result.match(INJECT_REG)
    endMatch = result.match(END_INJECT_REG)
  }

  return result
}

async function compileStyles() {
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
      transformed = convertCssVars(transformed, config.cssPlugin)
      transformed = injectCssImports(transformed)

      const outputFile = path.join(buildDir, config.outputDir, path.relative(buildDir, file).replace(/\.less$/, '.wxss'))
      ensureDirectoryExists(outputFile)
      fs.writeFileSync(outputFile, transformed, 'utf8')
    }),
  )
}

async function copyAssets() {
  const patterns = normalizePatterns(config.copyPlugin.entry)
  const files = await fg(patterns, { cwd: buildDir, absolute: true })

  await Promise.all(
    files.map(async (file) => {
      const relativeFile = path.relative(buildDir, file)
      const destFile = path.join(buildDir, config.outputDir, relativeFile)
      ensureDirectoryExists(destFile)

      if (/\.json$/i.test(file)) {
        const content = fs.readFileSync(file, 'utf8')
        fs.writeFileSync(destFile, transformUsingComponents(content, file), 'utf8')
      } else {
        fs.copyFileSync(file, destFile)
      }
    }),
  )
}

async function compileScripts() {
  const patterns = normalizePatterns(config.entry)
  const inputFiles = await fg(patterns, { cwd: buildDir, absolute: true })

  if (!inputFiles.length) {
    return
  }

  const bundle = await rollup({
    input: inputFiles,
    plugins: [nodeResolve({ preferBuiltins: true }), commonjs(), typescript({ tsconfig })],
    onwarn(warning, warn) {
      if (warning.code === 'THIS_IS_UNDEFINED') return
      warn(warning)
    },
  })

  await bundle.write({
    dir: path.join(buildDir, config.outputDir),
    format: 'cjs',
    preserveModules: true,
    preserveModulesRoot: path.join(buildDir, 'src'),
    sourcemap: false,
    banner: util.banner(),
  })
  await bundle.close()
}

function onBuildStart(opts: ComponentConfig) {
  console.info(opts.onStartMsg || '正在构建当前组件')
}

function onBuildEnd(opts: ComponentConfig) {
  console.info(opts.onCloseMsg || '构建完成惹')
}

function onBuildError(err: any) {
  console.error(err)
}

function debounce(fn: () => void, delay = 100) {
  let timer: NodeJS.Timeout | null = null
  return () => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(fn, delay)
  }
}

async function performBuild(opts: ComponentConfig = {}) {
  onBuildStart(opts)
  await compileScripts()
  await Promise.all([copyAssets(), compileStyles()])
  onBuildEnd(opts)
}

async function createWatcher(opts: ComponentConfig = {}) {
  const inputPatterns = normalizePatterns(config.entry)
  const inputFiles = await fg(inputPatterns, { cwd: buildDir, absolute: true })
  const watchOptions = {
    input: inputFiles,
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      commonjs(),
      typescript({ tsconfig }),
      copyPlugin({
        targets: [
          {
            src: normalizePatterns(config.copyPlugin.entry).map((pattern) => path.join(buildDir, pattern)),
            dest: path.join(buildDir, config.outputDir),
          },
        ],
        flatten: false,
      }),
    ],
    output: [
      {
        dir: path.join(buildDir, config.outputDir),
        format: 'cjs',
        preserveModules: true,
        preserveModulesRoot: path.join(buildDir, 'src'),
        sourcemap: false,
        banner: util.banner(),
      },
    ],
    watch: {
      include: [path.join(buildDir, 'src', '**')],
    },
  } as any

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
      onBuildError(event.error)
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

function rollupBuild(opts: ComponentConfig = {}) {
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

interface ComponentConfig {
  _?: string | string[]
  series?: 'series' | 'parallel'
  onStartMsg?: string
  onCloseMsg?: string
  onListening?: (eventName: 'start' | 'stop' | 'error') => Promise<any>
}
