import type { RollupBuild, RollupWatcher } from 'rollup';
export interface CopyPluginConfig {
    entry: string | string[];
}
export interface CssPluginConfig {
    entry: string | string[];
    pxTransform?: {
        designWidth: number;
    };
}
export interface DoraConfig {
    entry?: string | string[];
    outputDir?: string;
    copyPlugin?: CopyPluginConfig;
    cssPlugin?: CssPluginConfig;
}
interface ComponentConfig {
    _?: string | string[];
    series?: 'series' | 'parallel';
    onStartMsg?: string;
    onCloseMsg?: string;
    onListening?: (eventName: 'start' | 'stop' | 'error') => Promise<void>;
}
declare function rollupBuild(opts?: ComponentConfig): Promise<RollupBuild | RollupWatcher | void>;
export { rollupBuild as buildComponent };
