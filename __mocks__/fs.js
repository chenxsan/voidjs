const memfs = require('memfs')
// see https://github.com/jprichardson/node-fs-extra/issues/901#issuecomment-834824574
memfs.realpath.native = memfs.realpath
module.exports = memfs
