const fs = require('fs')
const path = require('path')
const { readdirSync } = fs

function collectPages(root) {
  return readdirSync(root).map(file => {
    const stats = fs.statSync(path.resolve(root, file))
    if (stats.isFile()) {
      return path.resolve(root, file)
    } else if (stats.isDirectory()) {
      return collectPages(path.resolve(root, file))
    }
  })
}

module.exports = function(root = path.resolve(process.cwd(), 'pages')) {
  return collectPages(root).flat(Infinity)
}
