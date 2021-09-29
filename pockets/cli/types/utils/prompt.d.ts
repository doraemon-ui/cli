/**
 * 组件类型
 *
 * @export
 * @enum {number}
 */
export declare enum ComponentType {
    MiniprogramLib = "miniprogram-lib",
    MiniprogramComponent = "miniprogram-component",
    MiniprogramComponentSnippet = "miniprogram-component-snippet"
}
/**
 * 获取组件类型
 *
 * @export
 * @returns {Promise<ComponentType>}
 */
export declare function getComponentType(): Promise<ComponentType>;
/**
 * npm 域
 *
 * @export
 * @enum {number}
 */
export declare enum NpmScope {
    UI = "@doraemon-ui"
}
/**
 * 获取组件所属的 npm 域
 *
 * @export
 * @returns {Promise<NpmScope>}
 */
export declare function getNpmScope(): Promise<NpmScope>;
