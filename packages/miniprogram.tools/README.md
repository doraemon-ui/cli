# `@doraemon-ui/miniprogram.tools`

> miniprogram 组件开发/构建脚本

## Usage

```js
const { startBuild, getRollupConfig } = require('@doraemon-ui/miniprogram.tools')

const indexConfig = getRollupConfig({
  entry: 'src/index.ts',
  outputFile: 'miniprogram_dist/index.js',
  format: 'esm',
  copy: true,
})

async function buildAll () {
  await startBuild(indexConfig)
}

buildAll()
```
