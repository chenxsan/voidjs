import { resolve } from 'path'
import pino from 'pino'

export const cwd = process.cwd()

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  prettyPrint: {
    translateTime: 'HH:MM:ss',
    ignore: 'pid,hostname'
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err
  }
})

export const alias = {
  img: resolve(cwd, 'public/img'),
  css: resolve(cwd, 'public/css')
}
export const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json']

export const performance: Performance = require('perf_hooks').performance
export const PerformanceObserver = require('perf_hooks').PerformanceObserver
