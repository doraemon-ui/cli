declare function rollupBuild(opts?: ComponentConfig): Promise<void> | Promise<import("rollup").RollupWatcher>;
export { rollupBuild as buildComponent };
interface ComponentConfig {
    _?: string | string[];
    series?: "series" | "parallel";
    onStartMsg?: string;
    onCloseMsg?: string;
    onListening?: (eventName: "start" | "stop" | "error") => Promise<any>;
}
