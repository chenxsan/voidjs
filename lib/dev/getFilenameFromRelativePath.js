const path = require('path')
module.exports = function(from, to) {
  const relativePath = path.relative(from, to)
  const { ext } = path.parse(relativePath)
  return relativePath.replace(ext, '.html')
}
