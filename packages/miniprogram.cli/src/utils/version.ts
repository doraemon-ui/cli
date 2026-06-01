import axios from 'axios'
import chalk from 'chalk'

export async function checkVersion() {
  const packageJson = require('../../package.json')
  const currentVersion = packageJson.version || ''
  const packageName = packageJson.name || ''
  if (currentVersion && packageName) {
    try {
      const { data: packageMetadata } = await axios.get(`https://registry.npmmirror.com/${packageName}`)
      if (!packageMetadata || !packageMetadata['dist-tags']) {
        return
      }
      const distTags = packageMetadata['dist-tags']
      const latestVersion = distTags.latest || ''
      if (!latestVersion) {
        return
      }
      if (currentVersion !== latestVersion) {
        console.log(chalk.yellow(`${packageName} is outdated (${currentVersion}). Latest version is ${latestVersion}, please update~`))
      }
    } catch (err) {
      console.log(chalk.yellow('Failed to check for updates, please report to the developer'))
      return
    }
  }
}

export async function checkTemplatesVersion() {
  const packageJson = require('@doraemon-ui/miniprogram.templates/package.json')
  const currentVersion = packageJson.version || ''
  const packageName = packageJson.name || ''
  if (currentVersion && packageName) {
    try {
      const { data: packageMetadata } = await axios.get(`https://registry.npmmirror.com/${packageName}`)
      if (!packageMetadata || !packageMetadata['dist-tags']) {
        return
      }
      const distTags = packageMetadata['dist-tags']
      const latestVersion = distTags.latest || ''
      if (!latestVersion) {
        return
      }
      if (currentVersion !== latestVersion) {
        console.log(chalk.yellow(`${packageName} is outdated (${currentVersion}). Latest version is ${latestVersion}, please update~`))
      }
    } catch (err) {
      console.log(chalk.yellow('Failed to check for updates, please report to the developer'))
      return
    }
  }
}
