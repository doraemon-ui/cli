import { RollupInputOptions, RollupOutOptions } from './rollup.conf';
/**
 * Powered by rollup
 *
 * @param {{
 *   inputOptions: RollupInputOptions
 *   outputOptions: RollupOutOptions
 * }} { inputOptions, outputOptions }
 */
declare function build({ inputOptions, outputOptions }: {
    inputOptions: RollupInputOptions;
    outputOptions: RollupOutOptions;
}): Promise<void>;
export { build };
