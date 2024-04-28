import * as path from 'path'
import * as fs from 'fs'
import * as util from 'gulp-util'
import * as through2 from 'through2'

const findComponentPath = (base: string, str: string) => {
  const paths = str.split('/')
  const length = paths.length - 1
  const componentName = paths[length]
  let i = paths.length - 1
  let pgk: Record<string, any> | undefined = undefined
  while (i) {
    const packageJSONPath = path.join(base, paths.slice(0, i).join('/'), 'package.json')
    if (fs.existsSync(packageJSONPath)) {
      pgk = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'))
      break
    }
    i--
  }
  return pgk ? `${pgk.name}/${componentName}` : str
}

const isJsonFile = (filename: string) => {
  return /\.json$/i.test(filename)
}

const convertJson = () => {
  const replace = (str = '', file) => {
    if (isJsonFile(file.path)) {
      const jsonValue: Record<string, any> = JSON.parse(str)
      if (jsonValue.usingComponents) {
        const usingComponents: Record<string, any> = {}
        Object.keys(jsonValue.usingComponents).forEach((key) => {
          usingComponents[key] = findComponentPath(file.base, jsonValue.usingComponents[key])
        })
        return JSON.stringify(Object.assign({}, jsonValue, { usingComponents }), null, 2)
      }
      return str
    }
    return str
  }

  return through2.obj(function(file, encoding, cb) {

    // 如果文件为空，不做任何操作，转入下一个操作，即下一个pipe
    if (file.isNull()) {
      this.push(file)
      return cb()
    }

    // 插件不支持对stream直接操作，抛出异常
    if (file.isStream()) {
      this.emit('error', new util.PluginError('convertJson', 'Streaming not supported'))
      return cb()
    }

    // 内容转换，处理好后，再转成 Buffer 形式
    const content = replace(file.contents.toString(), file)

    file.contents = typeof Buffer.from === 'function' ? Buffer.from(content) : new Buffer(content)

    // 下面这两句基本是标配，可参考 through2 的 API
    this.push(file)
    cb()
  })
}

export default convertJson
