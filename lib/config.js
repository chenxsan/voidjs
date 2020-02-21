const path = require('path')

const cwd = process.cwd()

exports.cwd = cwd
exports.logger = require('pino')({
  prettyPrint: {
    translateTime: 'yyyy-mm-dd HH:MM:ss',
    ignore: 'pid,hostname'
  }
})
exports.alias = {
  img: path.resolve(cwd, 'public/img'),
  css: path.resolve(cwd, 'public/css')
}
exports.extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json']

exports.performance = require('perf_hooks').performance
exports.PerformanceObserver = require('perf_hooks').PerformanceObserver
