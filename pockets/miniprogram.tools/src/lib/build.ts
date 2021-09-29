import * as rollup from 'rollup'
import chalk from 'chalk'
import { RollupInputOptions, RollupOutOptions } from './rollup.conf'

/**
 * Powered by rollup
 *
 * @param {{
 *   inputOptions: RollupInputOptions
 *   outputOptions: RollupOutOptions
 * }} { inputOptions, outputOptions }
 */
async function build ({ inputOptions, outputOptions }: {
  inputOptions: RollupInputOptions
  outputOptions: RollupOutOptions
}) {
  console.log('Powered by rollup')
  try {
    console.log(chalk.gray(`building ${outputOptions.file}...\n`))
    const bundle = await rollup.rollup(inputOptions)
    await bundle.write(outputOptions)
    console.log(chalk.cyan('Building complete\n'))
  } catch (err) {
    console.error(chalk.red(err))
  }
}

export {
  build
}
