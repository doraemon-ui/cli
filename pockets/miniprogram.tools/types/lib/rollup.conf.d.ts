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
    copy?: any[] | boolean;
    libraryName?: string;
    bundleDependencies?: boolean;
    internals?: any[];
    namedExports?: {
        [key: string]: any;
    };
    env?: {
        [key: string]: any;
    };
}
/**
 * 入口配置
 *
 * @export
 * @interface RollupInputOptions
 */
export interface RollupInputOptions {
    input?: string;
    external?: any[];
    plugins?: any[];
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
}
