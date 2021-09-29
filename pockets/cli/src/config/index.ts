import * as path from 'path'
import findParentDir from 'find-parent-dir'
import commandExists from 'command-exists'

const cwd = process.cwd()
const root = findParentDir.sync(cwd, 'lerna.json') as string
const templatesDir = path.resolve(__dirname, '../../templates')
const IS_WIN32 = process.platform === 'win32'
const USE_NPX = commandExists.sync('npx')

export {
  cwd,
  root,
  templatesDir,
  IS_WIN32,
  USE_NPX,
}
