import axios from 'axios'
import chalk from 'chalk'

export async function checkVersion () {
  const packageJson = require('../../package.json')
  const currentVersion = packageJson.version || ''
  const packageName = packageJson.name || ''
  if (currentVersion && packageName) {
    try {
      const { data: packageMetadata } = await axios.get(`https://registry.npm.taobao.org/${packageName}`)
      if (!packageMetadata || !packageMetadata['dist-tags']) {
        return
      }
      const distTags = packageMetadata['dist-tags']
      const latestVersion = distTags.latest || ''
      if (!latestVersion) {
        return
      }
      if (currentVersion !== latestVersion) {
        console.log(chalk.yellow(`${packageName} 当前版本 ${currentVersion}，发现最新版本 ${latestVersion}，请及时更新~`))
      }
    } catch (err) {
      console.log(chalk.yellow('线上版本检查失败，请报告开发者'))
      return
    }
  }
}
