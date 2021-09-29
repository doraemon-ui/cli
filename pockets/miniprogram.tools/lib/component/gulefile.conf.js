"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gulp4Build = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const gulp_1 = __importDefault(require("gulp"));
const ansi_1 = __importDefault(require("gulp-cli/lib/shared/ansi"));
const exit_1 = __importDefault(require("gulp-cli/lib/shared/exit"));
const format_error_1 = __importDefault(require("gulp-cli/lib/versioned/^4.0.0/format-error"));
const pretty_hrtime_1 = __importDefault(require("pretty-hrtime"));
const gulp_typescript_1 = __importDefault(require("gulp-typescript"));
const gulp_less_1 = __importDefault(require("gulp-less"));
const gulp_rename_1 = __importDefault(require("gulp-rename"));
const gulp_banner_1 = __importDefault(require("gulp-banner"));
const gulp_clean_css_1 = __importDefault(require("gulp-clean-css"));
const gulp_postcss_1 = __importDefault(require("gulp-postcss"));
// import sourcemaps from 'gulp-sourcemaps'
const autoprefixer_1 = __importDefault(require("autoprefixer"));
const gulp_convertCSSVar_1 = __importDefault(require("./gulp.convertCSSVar"));
const gulp_injectCSS_1 = __importDefault(require("./gulp.injectCSS"));
const gulp_px2rpx_1 = __importDefault(require("./gulp.px2rpx"));
const util_1 = __importDefault(require("../shared/util"));
const buildDir = util_1.default.buildDir;
const rootDir = util_1.default.rootDir;
const doraConfig = fs.existsSync(path.join(buildDir, 'dora.config.js')) ?
    path.join(buildDir, 'dora.config.js') :
    path.join(rootDir, 'dora.config.js');
const tsconfig = fs.existsSync(path.join(buildDir, 'tsconfig.json')) ?
    path.join(buildDir, 'tsconfig.json') :
    path.join(rootDir, 'tsconfig.json');
const tsProject = gulp_typescript_1.default.createProject(tsconfig, {
    typescript: require('typescript'),
});
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
}, fs.existsSync(doraConfig) ? require(doraConfig) : {});
const copy = (paths) => () => (gulp_1.default
    .src(paths.entry)
    .pipe(gulp_1.default.dest(paths.outputDir)));
const scripts = (paths) => () => (gulp_1.default
    .src(paths.entry)
    .pipe(tsProject())
    .js
    .pipe(gulp_banner_1.default(util_1.default.banner()))
    .pipe(gulp_1.default.dest(paths.outputDir)));
const styles = (paths) => () => (gulp_1.default
    .src(paths.entry)
    // .pipe(sourcemaps.init())
    .pipe(gulp_less_1.default({
    javascriptEnabled: true,
}))
    .pipe(gulp_postcss_1.default([autoprefixer_1.default()]))
    .pipe(gulp_px2rpx_1.default(paths.pxTransform))
    .pipe(gulp_convertCSSVar_1.default({ bodyNode: 'page' }))
    .pipe(gulp_clean_css_1.default({ format: 'beautify' }))
    .pipe(gulp_injectCSS_1.default())
    // .pipe(sourcemaps.write())
    .pipe(gulp_rename_1.default({ extname: '.wxss' }))
    .pipe(gulp_1.default.dest(paths.outputDir)));
const watch = () => {
    gulp_1.default.watch(config.copyPlugin.entry, copy({ entry: config.copyPlugin.entry, outputDir: config.outputDir }));
    gulp_1.default.watch(config.entry, scripts({ entry: config.entry, outputDir: config.outputDir }));
    gulp_1.default.watch(config.cssPlugin.entry, styles({ entry: config.cssPlugin.entry, outputDir: config.outputDir, pxTransform: config.cssPlugin.pxTransform }));
};
gulp_1.default.task('copy', copy({ entry: config.copyPlugin.entry, outputDir: config.outputDir }));
gulp_1.default.task('scripts', scripts({ entry: config.entry, outputDir: config.outputDir }));
gulp_1.default.task('styles', styles({ entry: config.cssPlugin.entry, outputDir: config.outputDir, pxTransform: config.cssPlugin.pxTransform }));
gulp_1.default.task('build', gulp_1.default.series(['copy', 'scripts', 'styles']));
gulp_1.default.task('watch', watch);
// Wire up logging events
function logEvents(gulpInst, onListening) {
    const loggedErrors = [];
    gulpInst.on('start', async function (evt) {
        onListening && await onListening('start');
        /* istanbul ignore next */
        // TODO: batch these
        // so when 5 tasks start at once it only logs one time with all 5
        const level = evt.branch ? 'debug' : 'info';
        console[level]('Starting', '\'' + ansi_1.default.cyan(evt.name) + '\'...');
    });
    gulpInst.on('stop', async function (evt) {
        onListening && await onListening('stop');
        const time = pretty_hrtime_1.default(evt.duration);
        /* istanbul ignore next */
        const level = evt.branch ? 'debug' : 'info';
        console[level]('Finished', '\'' + ansi_1.default.cyan(evt.name) + '\'', 'after', ansi_1.default.magenta(time));
    });
    gulpInst.on('error', async function (evt) {
        onListening && await onListening('error');
        const msg = format_error_1.default(evt);
        const time = pretty_hrtime_1.default(evt.duration);
        const level = evt.branch ? 'debug' : 'error';
        console[level]('\'' + ansi_1.default.cyan(evt.name) + '\'', ansi_1.default.red('errored after'), ansi_1.default.magenta(time));
        // If we haven't logged this before, log it and add to list
        if (loggedErrors.indexOf(evt.error) === -1) {
            console.error(msg);
            loggedErrors.push(evt.error);
        }
    });
}
/**
 * Build for gulp4
 *
 * @param {GulpConfig} [opts={}]
 */
function gulp4Build(opts = {}) {
    const tasks = opts._;
    const toRun = tasks.length ? tasks : ['default'];
    logEvents(gulp_1.default, opts.onListening);
    try {
        console.info(ansi_1.default.green(opts.onStartMsg || 'Powered by gulp4'));
        const runMethod = opts.series ? 'series' : 'parallel';
        gulp_1.default[runMethod](toRun)(function (err) {
            if (err) {
                exit_1.default(1);
            }
            console.info(ansi_1.default.green(opts.onCloseMsg || 'Build complete'));
        });
    }
    catch (err) {
        console.error(ansi_1.default.red(err.message));
        exit_1.default(1);
    }
}
exports.gulp4Build = gulp4Build;
