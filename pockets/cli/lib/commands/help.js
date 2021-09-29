"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const string_prototype_padend_1 = __importDefault(require("string.prototype.padend"));
const getPadLength_1 = require("../utils/getPadLength");
function help(api, options) {
    api.registerCommand('help', args => {
        const command = args._[0];
        if (!command) {
            logMainHelp();
        }
        else {
            logHelpForCommand(command, api.service.commands[command]);
        }
    });
    function logMainHelp() {
        console.log('\n  Usage: dora <command> [options]\n' +
            '\n  Commands:\n');
        const commands = api.service.commands;
        const padLength = getPadLength_1.getPadLength(commands);
        for (const name in commands) {
            if (name !== 'help') {
                const opts = commands[name].opts || {};
                console.log(`    ${chalk_1.default.blue(string_prototype_padend_1.default(name, padLength))}${opts.description || ''}`);
            }
        }
        console.log(`\n  run ${chalk_1.default.green('dora help [command]')} for usage of a specific command.\n`);
    }
    function logHelpForCommand(name, command) {
        if (!command) {
            console.log(chalk_1.default.red(`\n  command "${name}" does not exist.`));
        }
        else {
            const opts = command.opts || {};
            if (opts.usage) {
                console.log(`\n  Usage: ${opts.usage}`);
            }
            if (opts.options) {
                console.log('\n  Options:\n');
                const padLength = getPadLength_1.getPadLength(opts.options);
                for (const name in opts.options) {
                    console.log(`    ${chalk_1.default.blue(string_prototype_padend_1.default(name, padLength))}${opts.options[name]}`);
                }
            }
            if (opts.details) {
                console.log();
                console.log(opts.details.split('\n').map(line => `  ${line}`).join('\n'));
            }
            console.log();
        }
    }
}
exports.default = help;
