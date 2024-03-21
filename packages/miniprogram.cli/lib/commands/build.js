"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultModes = void 0;
function build(api, options) {
    api.registerCommand('build', {
        description: 'build for production',
        usage: 'dora build [options]',
        options: {
            '--mode': 'specify env mode (default: production)',
            '--watch': 'watch for changes',
        },
    }, async (args, rawArgs) => {
        const { gulp4Build } = require('@doraemon-ui/miniprogram.tools');
        return gulp4Build({
            _: args.watch ? ['watch'] : ['build'],
            onStartMsg: args.watch ? '正在监听文件改变' : '正在构建当前组件',
            onCloseMsg: '构建完成惹',
        });
    });
}
exports.default = build;
exports.defaultModes = {
    build: 'production',
};
