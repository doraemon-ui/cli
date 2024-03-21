#!/usr/bin/env node

import minimist from 'minimist'
import { Service } from '..'
import { error } from '../utils/error'

const service = new Service(process.env.DORA_CLI_CONTEXT || process.cwd())

const rawArgv = process.argv.slice(2)
const args = minimist(rawArgv)

const command = args._[0]

service.run(command, args, rawArgv).catch(err => {
  error(err)
  process.exit(1)
})
