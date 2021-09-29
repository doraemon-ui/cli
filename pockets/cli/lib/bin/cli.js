#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const minimist_1 = __importDefault(require("minimist"));
const __1 = require("..");
const error_1 = require("../utils/error");
const service = new __1.Service(process.env.DORA_CLI_CONTEXT || process.cwd());
const rawArgv = process.argv.slice(2);
const args = (0, minimist_1.default)(rawArgv);
const command = args._[0];
service.run(command, args, rawArgv).catch(err => {
    (0, error_1.error)(err);
    process.exit(1);
});
