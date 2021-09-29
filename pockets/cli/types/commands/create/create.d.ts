import { ComponentType, NpmScope } from '../../utils/prompt';
/**
 * 预设组件模板
 *
 * @export
 * @param {string} cwd 当前工作目录
 * @param {string} name 组件名
 * @param {ComponentType} componentType 组件模板
 * @param {NpmScope} npmScope 组件所属的 npm 域
 * @returns
 */
export declare function create(cwd: string, name: string, componentType: ComponentType, npmScope: NpmScope): Promise<never>;
