"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultModes = void 0;
exports.default = build;
function build(api, options) {
    api.registerCommand('build', {
        description: 'build for production',
        usage: 'dora build [options]',
        options: {
            '--mode': 'specify env mode (default: production)',
            '--watch': 'watch for changes',
        },
    }, async (args, rawArgs) => {
        const { buildComponent } = require('@doraemon-ui/miniprogram.tools');
        return buildComponent({
            _: args.watch ? ['watch'] : ['build'],
            onStartMsg: args.watch ? 'Watching for file changes' : 'Building component',
            onCloseMsg: 'Build complete',
        });
    });
}
exports.defaultModes = {
    build: 'production',
};
