/**
 * Build for gulp4
 *
 * @param {GulpConfig} [opts={}]
 */
declare function gulp4Build(opts?: GulpConfig): void;
export { gulp4Build, };
/**
 * 构建配置
 *
 * @interface GulpConfig
 */
interface GulpConfig {
    _?: string | string[];
    series?: 'series' | 'parallel';
    onStartMsg?: string;
    onCloseMsg?: string;
    onListening?: (eventName: 'start' | 'stop' | 'error') => Promise<any>;
}
