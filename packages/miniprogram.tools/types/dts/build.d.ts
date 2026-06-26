import { DtsConfig } from './getDtsConfig';
/**
 * Build a bundled declaration file from emitted temporary .d.ts files.
 *
 * @param {DtsConfig} [options={}]
 * @returns {Promise<void>}
 */
declare function buildDts(options?: DtsConfig): Promise<void>;
export { buildDts };
