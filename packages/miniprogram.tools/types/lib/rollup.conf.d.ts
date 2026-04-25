import type { Plugin as RollupPlugin } from 'rollup';
interface CopyTarget {
    src: string;
    dest: string;
}
/**
 * Get rollup config
 *
 * @export
 * @param {RollupConfig} [opts={}]
 * @returns
 */
export declare function rollupConfig(opts?: RollupConfig): {
    inputOptions: RollupInputOptions;
    outputOptions: RollupOutOptions;
};
/**
 * 构建配置
 *
 * @export
 * @interface RollupConfig
 */
export interface RollupConfig {
    entry?: string;
    outputFile?: string;
    format?: 'esm';
    copy?: CopyTarget[] | boolean;
    libraryName?: string;
    bundleDependencies?: boolean;
    internals?: string[];
    namedExports?: Record<string, string[]>;
    env?: Record<string, string>;
}
/**
 * 入口配置
 *
 * @export
 * @interface RollupInputOptions
 */
export interface RollupInputOptions {
    input?: string;
    external?: (string | RegExp)[];
    plugins?: RollupPlugin[];
    inlineDynamicImports?: boolean;
}
/**
 * 出口配置
 *
 * @export
 * @interface RollupOutOptions
 */
export interface RollupOutOptions {
    file?: string;
    format?: 'esm';
    name?: string;
    sourcemap?: boolean;
    banner?: string;
    exports?: 'default' | 'named' | 'none' | 'auto';
}
export {};
