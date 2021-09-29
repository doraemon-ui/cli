/// <reference types="node" />
/**
 * 以 Spawn 方式运行外部程序.
 *
 * @param {ISpawnParam} param
 */
declare function spawn(param: ISpawnParam): void;
export { spawn, };
interface ISpawnParam {
    command: string;
    args?: string[];
    options?: {};
    onData?: (data: string | Buffer) => void;
    onClose?: (code: number) => void;
    onError?: (error: Error) => void;
    /**
     * 启用 StdIn 功能.
     * 传输父进程 StdIn 至子进程, 等同于 options.stdio = 'inherit'
     *
     * @type {boolean}
     * @memberof ISpawnParam
     */
    useStdIn?: boolean;
}
