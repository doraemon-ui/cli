import * as util from 'gulp-util'
import * as through2 from 'through2'

const defaultConfig = {
  designWidth: 750,
  deviceRatio: {
    375: 2 / 1,
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  unit: 'rpx',
  replaceUnit: 'px',
  unitPrecision: 5,
  onePxTransform: true,
}

/**
 * 自定义插件 - px to rpx
 */
const px2Rpx = (opts) => {
  const options = Object.assign({}, defaultConfig, opts || {})
  const ratio = options.deviceRatio[options.designWidth] || 1
  // 正则匹配
  const pxReplace = (value = '') => {
    const pxRegExp = new RegExp(`"[^"]+"|'[^']+'|url\\([^\\)]+\\)|(\\d*\\.?\\d+)${options.replaceUnit}`, 'g')
    const pxReplace = (m, $1) => {
      if (!$1) return m
      const pixels = parseFloat($1.toFixed(options.unitPrecision))
      return pixels === 0 ? 0 : pixels + options.unit
    }
    return value.replace(pxRegExp, (m, $1) => {
      // 判断 1px 是否需要被转换
      if ($1 && $1.toString() === '1' && !options.onePxTransform) {
        return m
      }
      return pxReplace(m, $1 ? $1 * ratio : $1)
    })
  }

  return through2.obj(function(file, encoding, cb) {

    // 如果文件为空，不做任何操作，转入下一个操作，即下一个pipe
    if (file.isNull()) {
      this.push(file)
      return cb()
    }

    // 插件不支持对stream直接操作，抛出异常
    if (file.isStream()) {
      this.emit('error', new util.PluginError('px2Rpx', 'Streaming not supported'))
      return cb()
    }

    // 内容转换，处理好后，再转成 Buffer 形式
    const content = pxReplace(file.contents.toString())

    file.contents = typeof Buffer.from === 'function' ? Buffer.from(content) : new Buffer(content)

    // 下面这两句基本是标配，可参考 through2 的 API
    this.push(file)
    cb()
  })
}

export default px2Rpx
