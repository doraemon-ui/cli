"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmScope = exports.ComponentType = void 0;
exports.getComponentType = getComponentType;
exports.getNpmScope = getNpmScope;
const inquirer = __importStar(require("inquirer"));
const prompt = inquirer.createPromptModule();
/**
 * 组件类型
 *
 * @export
 * @enum {number}
 */
var ComponentType;
(function (ComponentType) {
    ComponentType["MiniprogramLib"] = "miniprogram-lib";
    ComponentType["MiniprogramComponent"] = "miniprogram-component";
    ComponentType["MiniprogramComponentSnippet"] = "miniprogram-component-snippet";
})(ComponentType || (exports.ComponentType = ComponentType = {}));
/**
 * 获取组件类型
 *
 * @export
 * @returns {Promise<ComponentType>}
 */
async function getComponentType() {
    return prompt({
        name: 'componentType',
        type: 'list',
        message: '请选择要创建的组件类型：',
        choices: [
            {
                name: 'Miniprogram Lib',
                value: ComponentType.MiniprogramLib,
            },
            {
                name: 'Miniprogram Component',
                value: ComponentType.MiniprogramComponent,
            },
            {
                name: 'Miniprogram Component Snippet',
                value: ComponentType.MiniprogramComponentSnippet,
            },
        ],
    }).then((answer) => {
        return answer.componentType;
    });
}
/**
 * npm 域
 *
 * @export
 * @enum {number}
 */
var NpmScope;
(function (NpmScope) {
    NpmScope["UI"] = "@doraemon-ui";
})(NpmScope || (exports.NpmScope = NpmScope = {}));
/**
 * 获取组件所属的 npm 域
 *
 * @export
 * @returns {Promise<NpmScope>}
 */
async function getNpmScope() {
    let scope = await prompt({
        name: 'npmScope',
        type: 'list',
        message: '请选择组件所属的 npm 域',
        choices: [
            NpmScope.UI,
            // new inquirer.Separator(),
            // 'others'
        ],
    }).then((answer) => answer.npmScope);
    // if (scope === 'others') {
    //   scope = await prompt({
    //     name: 'inputNpmScope',
    //     type: 'input',
    //     message: '请输入组件所属的 npm 域'
    //   }).then(answer => answer.inputNpmScope)
    // }
    return scope;
}
