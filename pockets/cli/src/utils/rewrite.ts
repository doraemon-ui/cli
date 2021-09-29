import * as path from 'path'
import * as fs from 'fs'

export function writeFile (filename: string, content: string): Promise<any> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, content, 'utf-8', (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(content)
      }
    })
  })
}

export function rewrite ({
  filePath,
  fileName,
  transformData,
}: {
  filePath: string
  fileName: string
  transformData: (data: any) => string
}): Promise<any> {
  const isJSON = fileName.endsWith('.json')
  const fpath = path.join(filePath, fileName)
  const fcontent = isJSON ? require(fpath) : fs.readFileSync(fpath, 'utf8')
  const data = isJSON ? transformData.call(null, { ...fcontent }) : transformData.call(null, fcontent)
  return writeFile(fpath, data)
}
