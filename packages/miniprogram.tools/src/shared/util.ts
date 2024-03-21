import * as path from 'path'
import moment from 'moment'

const buildDir = process.cwd()
const rootDir = path.join(buildDir, '..', '..')

const pkg = () => require(path.join(buildDir, 'package.json'))

const banner = () => {
  const packageJSON = pkg()
  const toolsVersion = require('../../package.json').version
  return `${`
/**
 * ${packageJSON.name}.
 * © 2021 - ${moment().year()} Doraemon UI.
 * Built on ${moment().format('YYYY-MM-DD, HH:mm:ss')}.
 * With @doraemon-ui/miniprogram.tools v${toolsVersion}.
 */
`.trim()}\n`
}

export default {
  pkg,
  banner,
  buildDir,
  rootDir,
}
