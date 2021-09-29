/**
 * 执行 lerna 指令
 * @param args lerna 命令参数
 * @param onStartMsg
 * @param onCloseMsg
 */
export declare function runLernaCommand(args?: string[], onStartMsg?: string, onCloseMsg?: string): Promise<void>;
/**
 * 获取 lerna 配置信息
 */
export declare function getLernaConfig(): any;
