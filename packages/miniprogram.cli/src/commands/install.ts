import * as path from 'path'
import * as fs from 'fs'
import { PluginAPI } from '../PluginAPI'
import { Options } from '../options'
import { runPnpmCommand } from '../utils/pnpm'

export default function install(api: PluginAPI, options: Options) {
  api.registerCommand(
    'install',
    {
      description: 'Install a single dependency to matched packages',
      usage: 'install [packageName]',
      options: {
        '--dev': 'Save to devDependencies',
      },
    },
    async (args, rawArgs) => {
      await installPackage(api.getCwd(), args._[0], args.dev)
    },
  )
}

export async function installPackage(to: string, packageName: string, dev: boolean = false) {
  const packageJSONPath = path.join(to, 'package.json')
  if (!fs.existsSync(packageJSONPath)) {
    return Promise.reject('package.json not found in current directory')
  }
  const cwdPackageJSON = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'))
  const cwdPackageName = cwdPackageJSON.name
  if (!cwdPackageJSON.name) {
    return Promise.reject('package.json is missing the "name" field')
  }
  if (packageName && packageName.length) {
    await addPackage(packageName, dev, cwdPackageName)
  } else {
    await installPackageDependencies(cwdPackageName)
  }
}

/**
 * 执行 lerna bootstrap
 * 安装 package.json 中的依赖
 */
async function installPackageDependencies(scope: string) {
  await runPnpmCommand(['install', `--filter=${scope}`], `Installing dependencies for ${scope}`, 'Installation complete')
}

/**
 * 执行 lerna add <packageName>
 * 安装特定依赖
 * @param packageName 要安装的包名
 */
async function addPackage(packageName: string, dev: boolean, scope: string) {
  if (!packageName) {
    return
  }
  await runPnpmCommand(
    ['add', packageName, `--filter=${scope}`].concat(dev ? ['-D'] : []),
    `Installing ${packageName} to current directory`,
    'Installation complete',
  )
}
