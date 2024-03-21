"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaults = void 0;
const defaults = () => ({
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
    devServer: {},
});
exports.defaults = defaults;
