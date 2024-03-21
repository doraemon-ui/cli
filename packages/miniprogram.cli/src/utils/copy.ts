import ncp from 'ncp'

export function copyFolder (from: string, to: string, options: object = {}) {
  return new Promise((resolve, reject) => {
    ncp(from, to, options, function (err) {
      if (err) {
        reject(err)
      } else {
        resolve({})
      }
    })
  })
}
