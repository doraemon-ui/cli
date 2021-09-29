import * as path from 'path'
import chalk from 'chalk'
import gitUsername from 'git-user-name'
import { templatesDir } from '../../config'
import { installPackage as install } from '../install'
import { copyFolder } from '../../utils/copy'
import { ComponentType, getComponentType, getNpmScope, NpmScope } from '../../utils/prompt'
import { rewrite } from '../../utils/rewrite'

/**
 * 下划线转大写驼峰
 *
 * @param {string} str
 * @param {string} [split='-']
 * @returns
 */
function toUpperCase (str: string, split: string = '-') {
  return str.split(split).reduce((acc, name) => {
    return acc += `${name.charAt(0).toUpperCase()}${name.slice(1)}`
  }, '')
}

function renderJSON (content: object, getData: Function) {
  const data = getData.call(null, { ...content })
  for (let key in data) {
    content[key] = data[key]
  }
  return JSON.stringify(content, null ,2)
}

function renderFile (content: string, packageName: string = '', componentNameShort: string = '') {
  return content
    .replace(/{{packageName}}/g, packageName)
    .replace(/DemoComponent/g, toUpperCase(componentNameShort))
    .replace(/demo-component/g, componentNameShort)
    .replace(/DemoLib/g, toUpperCase(componentNameShort))
    .replace(/demo-lib/g, componentNameShort)
}

function rewritePackageJSON (componentPath: string, getData: Function) {
  return rewrite({
    filePath: componentPath,
    fileName: 'package.json',
    transformData (data) {
      return renderJSON(data, getData)
    },
  })
}

function rewriteTypeDeclare (componentPath: string, packageName: string) {
  return rewrite({
    filePath: componentPath,
    fileName: 'index.d.ts',
    transformData (data) {
      return renderFile(data, packageName)
    },
  })
}

function rewriteReadme (componentPath: string, packageName: string) {
  return rewrite({
    filePath: componentPath,
    fileName: 'README.md',
    transformData (data) {
      return renderFile(data, packageName)
    },
  })
}

async function rewriteDemo (rootName: string, author: any, packageJSON: any, cwd) {
  const distDir = path.join(cwd, rootName, 'proscenium')
  const packageName = packageJSON.name
  const packageVer = packageJSON.version
  const componentName = packageName.split('/')[packageName.split('/').length - 1]
  const componentNameShort = componentName.split('.')[componentName.split('.').length - 1]

  await rewrite({
    filePath: distDir,
    fileName: 'project.config.json',
    transformData (data) {
      return renderJSON(data, () => ({
        projectname: `${packageName}-proscenium`,
      }))
    },
  })
  await rewritePackageJSON(path.join(distDir, 'pages'), (packageJSON) => ({
    name: `${packageName}-proscenium`,
    private: true,
    description: `${componentName.split('.').join(' ')} component demo for doraemon-ui`,
    author,
    keywords: [...packageJSON.keywords, ...componentName.split('.')],
    dependencies: {
      [packageName]: `^${packageVer}`,
    },
  }))
  await rewrite({
    filePath: path.join(distDir, 'pages/index'),
    fileName: 'index.json',
    transformData (data) {
      return renderJSON(data, () => ({
        navigationBarTitleText: componentName,
        usingComponents: {
          [`dora-${componentNameShort}`]: `${packageName}/index`,
        },
      }))
    },
  })
  await rewrite({
    filePath: path.join(distDir, 'pages/index'),
    fileName: 'index.wxml',
    transformData (data) {
      return data.replace(/{{componentName}}/g, componentName)
        .replace(/{{componentFragment}}/g, `<dora-${componentNameShort}>${componentName}</dora-${componentNameShort}>`)
    },
  })
}

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
export async function create (cwd: string, name: string, componentType: ComponentType, npmScope: NpmScope) {
  if (!name) {
    return Promise.reject('缺少 name 参数')
  }

  const type = componentType || await getComponentType()
  switch (type) {
      case ComponentType.MiniprogramLib:
        createLib(cwd, name, type, npmScope)
        break
      case ComponentType.MiniprogramComponent:
        createComponent(cwd, name, type, npmScope)
        break
      case ComponentType.MiniprogramComponentSnippet:
        createComponentSnippet(cwd, name, type)
        break
  }
}

/**
 * 创建小程序组件模板
 *
 * @param {string} cwd 当前工作目录
 * @param {string} name 组件名称
 * @param {ComponentType} type 组件模板
 * @param {NpmScope} npmScope 组件所属的 npm 域
 * @returns
 */
async function createComponent (cwd: string, name: string, type: ComponentType, npmScope: NpmScope) {
  if (!name) {
    return Promise.reject('缺少 name 参数')
  }

  const scope = npmScope || await getNpmScope()
  const author = gitUsername()

  const template = path.join(templatesDir, type)
  const distDir = path.join(cwd, name)
  await copyFolder(template, distDir)

  const packageName = `${scope}/${name}`
  const componentNameShort = name.split('.')[name.split('.').length - 1]
  const packageJSON = await rewritePackageJSON(distDir, (packageJSON) => ({
    name: packageName,
    private: false,
    description: `${name.split('.').join(' ')} component for doraemon-ui`,
    author,
    keywords: [...packageJSON.keywords, ...name.split('.')],
  }))
  await rewriteTypeDeclare(distDir, packageName)
  await rewriteReadme(distDir, packageName)
  await rewrite({
    filePath: path.join(distDir, 'src'),
    fileName: 'index.ts',
    transformData (data) {
      return renderFile(data, packageName, componentNameShort)
    },
  })
  await rewrite({
    filePath: path.join(distDir, '__tests__'),
    fileName: 'index.spec.ts',
    transformData (data) {
      return renderFile(data, packageName, componentNameShort)
    },
  })
  await rewrite({
    filePath: path.join(distDir, 'assets'),
    fileName: 'variables.less',
    transformData (data) {
      return renderFile(data, packageName, componentNameShort)
    },
  })
  await rewrite({
    filePath: path.join(distDir, 'assets'),
    fileName: 'index.less',
    transformData (data) {
      return renderFile(data, packageName, componentNameShort)
    },
  })
  await rewriteDemo(name, author, JSON.parse(packageJSON), cwd)
  await install(distDir, '')
}

/**
 * 创建小程序组件片段
 *
 * @param {string} cwd 当前工作目录
 * @param {string} name 组件名称
 * @param {ComponentType} type 组件模板
 * @returns
 */
async function createComponentSnippet (cwd: string, name: string, type: ComponentType) {
  if (!name) {
    return Promise.reject('缺少 name 参数')
  }

  const template = path.join(templatesDir, type)
  const distDir = path.join(cwd)
  await copyFolder(template, distDir, {
    rename (target: string) {
      const reg = /index(.\w+)$/
      const match = target.match(reg)
      return match ? target.replace(reg, `${name}${match[1]}`) : target
    },
  })
  await rewrite({
    filePath: distDir,
    fileName: `${name}.ts`,
    transformData (data) {
      return renderFile(data, '', name)
    },
  })
  console.log(chalk.green('安装完成惹'))
}

/**
 * 创建小程序库模板
 *
 * @param {string} cwd 当前工作目录
 * @param {string} name 库名称
 * @param {ComponentType} type 库模板
 * @param {NpmScope} npmScope 库所属的 npm 域
 * @returns
 */
async function createLib (cwd: string, name: string, type: ComponentType, npmScope: NpmScope) {
  if (!name) {
    return Promise.reject('缺少 name 参数')
  }

  const scope = npmScope || await getNpmScope()
  const author = gitUsername()

  const template = path.join(templatesDir, type)
  const distDir = path.join(cwd, name)
  await copyFolder(template, distDir)

  const packageName = `${scope}/${name}`
  const componentNameShort = name.split('.')[name.split('.').length - 1]
  await rewritePackageJSON(distDir, (packageJSON) => ({
    name: packageName,
    private: false,
    description: `${name.split('.').join(' ')} lib for doraemon-ui`,
    author,
    keywords: [...packageJSON.keywords, ...name.split('.')],
  }))
  await rewriteTypeDeclare(distDir, packageName)
  await rewriteReadme(distDir, packageName)
  await rewrite({
    filePath: path.join(distDir, 'src'),
    fileName: 'index.ts',
    transformData (data) {
      return renderFile(data, packageName, componentNameShort)
    },
  })
  await rewrite({
    filePath: path.join(distDir, '__tests__'),
    fileName: 'index.spec.ts',
    transformData (data) {
      return renderFile(data, packageName, componentNameShort)
    },
  })
  await install(distDir, '')
}