#!/usr/bin/env node

const yargs = require('yargs')
const server = require('./server')
const build = require('./build')
const { logger, cwd } = require('./config')
const path = require('path')
const rimraf = require('rimraf')

yargs
  .scriptName('htmlgaga')
  .usage(`$0 <cmd> [args]`)
  .command(
    'dev',
    'Run development server',
    {
      host: {
        default: 'localhost',
        description: 'Host to run server'
      },
      port: {
        default: 8080,
        description: 'Port to run server'
      }
    },
    function(argv) {
      const { host, port } = argv
      server()
        .listen(port, host, err => {
          if (err) {
            return logger.error(err)
          }
          logger.info(`Starting server on http://${host}:${port}`)
        })
        .on('error', err => {
          logger.info('You might run server on another port with option --port')
          throw err
        })
    }
  )
  .command(
    'build [src]',
    'Build static html & assets',
    {
      src: {
        default: 'pages',
        description: 'The source directory holds our pages'
      },
      dest: {
        default: 'out',
        description: 'The output directory'
      }
    },
    function(argv) {
      const { src, dest } = argv
      const outDir = path.resolve(cwd, dest)
      rimraf(outDir, err => {
        if (err) return logger.error(err)
        build(src, outDir)
      })
    }
  )
  .help().argv
