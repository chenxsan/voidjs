const fs = require('fs')
const path = require('path')
const { cwd } = require('./config')

async function collect(root = cwd, acc = []) {
  const files = await fs.promises.readdir(root)
  for (let file of files) {
    const filePath = path.resolve(root, file)
    const stats = await fs.promises.stat(filePath)
    if (stats.isFile()) {
      const f = filePath
      acc.push(f)
    } else if (stats.isDirectory()) {
      await collect(filePath, acc)
    }
  }
  return acc
}
module.exports = collect
