import * as path from 'path'
import * as fs from 'fs'
import gulp from 'gulp'
import ansi from 'gulp-cli/lib/shared/ansi'
import exit from 'gulp-cli/lib/shared/exit'
import formatError from 'gulp-cli/lib/versioned/^4.0.0/format-error'
import prettyTime from 'pretty-hrtime'
import ts from 'gulp-typescript'
import less from 'gulp-less'
import rename from 'gulp-rename'
import banner from 'gulp-banner'
import cleanCSS from 'gulp-clean-css'
import postcss from 'gulp-postcss'
// import sourcemaps from 'gulp-sourcemaps'
import autoprefixer from 'autoprefixer'
import convertCSSVar from './gulp.convertCSSVar'
import injectCSS from './gulp.injectCSS'
import px2rpx from './gulp.px2rpx'
import convertJson from './gulp.convertJson'
import util from '../shared/util'

const buildDir = util.buildDir
const rootDir = util.rootDir

const doraConfig = fs.existsSync(path.join(buildDir, 'dora.config.js')) ?
  path.join(buildDir, 'dora.config.js') :
  path.join(rootDir, 'dora.config.js')

const tsconfig = fs.existsSync(path.join(buildDir, 'tsconfig.json')) ?
  path.join(buildDir, 'tsconfig.json') :
  path.join(rootDir, 'tsconfig.json')

const tsProject = ts.createProject(tsconfig, {
  typescript: require('typescript'),
})

const config = Object.assign({
  entry: ['./src/**/*.ts'],
  outputDir: './miniprogram_dist',
  copyPlugin: {
    entry: [
      './src/**/*.json',
      './src/**/*.wxml',
      './src/**/*.wxss',
      '!./src/**/*.ts',
    ],
  },
  cssPlugin: {
    entry: [
      './src/**/*.less',
    ],
    pxTransform: {
      designWidth: 375,
    },
  },
}, fs.existsSync(doraConfig) ? require(doraConfig) : {})

const copy = (paths) => () => (
  gulp
    .src(paths.entry)
    .pipe(convertJson())
    .pipe(gulp.dest(paths.outputDir))
)

const scripts = (paths) => () => (
  gulp
    .src(paths.entry)
    .pipe(tsProject())
    .js
    .pipe(banner(util.banner()))
    .pipe(gulp.dest(paths.outputDir))
)

const styles = (paths) => () => (
  gulp
    .src(paths.entry)
  // .pipe(sourcemaps.init())
    .pipe(less({
      javascriptEnabled: true,
    }))
    .pipe(postcss([ autoprefixer() ]))
    .pipe(px2rpx(paths.pxTransform))
    .pipe(convertCSSVar({ bodyNode: 'page' }))
    .pipe(cleanCSS({ format: 'beautify' }))
    .pipe(injectCSS())
  // .pipe(sourcemaps.write())
    .pipe(rename({ extname: '.wxss' }))
    .pipe(gulp.dest(paths.outputDir))
)

const watch = () => {
  gulp.watch(config.copyPlugin.entry, copy({ entry: config.copyPlugin.entry, outputDir: config.outputDir }))
  gulp.watch(config.entry, scripts({ entry: config.entry, outputDir: config.outputDir }))
  gulp.watch(config.cssPlugin.entry, styles({ entry: config.cssPlugin.entry, outputDir: config.outputDir, pxTransform: config.cssPlugin.pxTransform }))
}

gulp.task('copy', copy({ entry: config.copyPlugin.entry, outputDir: config.outputDir }))
gulp.task('scripts', scripts({ entry: config.entry, outputDir: config.outputDir }))
gulp.task('styles', styles({ entry: config.cssPlugin.entry, outputDir: config.outputDir, pxTransform: config.cssPlugin.pxTransform }))
gulp.task('build', gulp.series(['copy', 'scripts', 'styles']))
gulp.task('watch', watch)


// Wire up logging events
function logEvents (gulpInst, onListening) {

  const loggedErrors: any[] = []

  gulpInst.on('start', async function(evt) {
    onListening && await onListening('start')
    /* istanbul ignore next */
    // TODO: batch these
    // so when 5 tasks start at once it only logs one time with all 5
    const level = evt.branch ? 'debug' : 'info'
    console[level]('Starting', '\'' + ansi.cyan(evt.name) + '\'...')
  })

  gulpInst.on('stop', async function(evt) {
    onListening && await onListening('stop')
    const time = prettyTime(evt.duration)
    /* istanbul ignore next */
    const level = evt.branch ? 'debug' : 'info'
    console[level](
      'Finished', '\'' + ansi.cyan(evt.name) + '\'',
      'after', ansi.magenta(time)
    )
  })

  gulpInst.on('error', async function(evt) {
    onListening && await onListening('error')
    const msg = formatError(evt)
    const time = prettyTime(evt.duration)
    const level = evt.branch ? 'debug' : 'error'
    console[level](
      '\'' + ansi.cyan(evt.name) + '\'',
      ansi.red('errored after'),
      ansi.magenta(time)
    )

    // If we haven't logged this before, log it and add to list
    if (loggedErrors.indexOf(evt.error) === -1) {
      console.error(msg)
      loggedErrors.push(evt.error)
    }
  })
}

/**
 * Build for gulp4
 *
 * @param {GulpConfig} [opts={}]
 */
function gulp4Build (opts: GulpConfig = {}) {
  const tasks = opts._
  const toRun = tasks?.length ? tasks : ['default']
  logEvents(gulp, opts.onListening)
  try {
    console.info(ansi.green(opts.onStartMsg || 'Powered by gulp4'))
    const runMethod = opts.series ? 'series' : 'parallel'
    gulp[runMethod](toRun)(function(err) {
      if (err) {
        exit(1)
      }
      console.info(ansi.green(opts.onCloseMsg || 'Build complete'))
    })
  } catch (err) {
    console.error(ansi.red(err.message))
    exit(1)
  }
}

export {
  gulp4Build,
}

/**
 * 构建配置
 *
 * @interface GulpConfig
 */
interface GulpConfig {
  _?: string | string[]
  series?: 'series' | 'parallel'
  onStartMsg?: string
  onCloseMsg?: string
  onListening?: (eventName: 'start' | 'stop' | 'error') => Promise<any>
}