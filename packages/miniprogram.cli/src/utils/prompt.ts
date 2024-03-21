import * as inquirer from 'inquirer'

const prompt = inquirer.createPromptModule()

/**
 * 组件类型
 *
 * @export
 * @enum {number}
 */
export enum ComponentType {
  MiniprogramLib = 'miniprogram-lib',
  MiniprogramComponent = 'miniprogram-component',
  MiniprogramComponentSnippet = 'miniprogram-component-snippet'
}

/**
 * 获取组件类型
 *
 * @export
 * @returns {Promise<ComponentType>}
 */
export async function getComponentType (): Promise<ComponentType> {
  return prompt<any>({
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
  }).then(answer => {
    return answer.componentType
  })
}

/**
 * npm 域
 *
 * @export
 * @enum {number}
 */
export enum NpmScope {
  UI = '@doraemon-ui'
}

/**
 * 获取组件所属的 npm 域
 *
 * @export
 * @returns {Promise<NpmScope>}
 */
export async function getNpmScope (): Promise<NpmScope> {
  let scope = await prompt({
    name: 'npmScope',
    type: 'list',
    message: '请选择组件所属的 npm 域',
    choices: [
      NpmScope.UI,
      // new inquirer.Separator(),
      // 'others'
    ],
  }).then(answer => answer.npmScope)

  // if (scope === 'others') {
  //   scope = await prompt({
  //     name: 'inputNpmScope',
  //     type: 'input',
  //     message: '请输入组件所属的 npm 域'
  //   }).then(answer => answer.inputNpmScope)
  // }

  return scope
}
