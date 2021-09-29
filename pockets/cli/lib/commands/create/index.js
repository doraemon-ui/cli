"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prompt_1 = require("../../utils/prompt");
function create(api, options) {
    api.registerCommand('create', {
        description: 'create a new component powered by dora',
        usage: 'create <name>',
        options: {
            '--default': 'Skip prompts and use default preset',
        },
    }, async (args, rawArgs) => {
        const type = args.default ? prompt_1.ComponentType.MiniprogramComponent : null;
        const npmScope = args.default ? prompt_1.NpmScope.UI : null;
        return require('./create').create(api.getCwd(), args._[0], type, npmScope);
    });
}
exports.default = create;
