const path = require('path')
module.exports = function getEntryKeyFromRelativePath(from, to) {
  const relativePath = path.relative(from, to)
  const { base, name } = path.parse(relativePath)
  return relativePath.replace(base, '') + name + '/index'
}
