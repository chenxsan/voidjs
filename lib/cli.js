#!/usr/bin/env node

const yargs = require('yargs')
const server = require('./dev')
const build = require('./build')
const { logger, cwd } = require('./config')
const path = require('path')
const rimraf = require('rimraf')
const { existsSync } = require('fs')

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
    'build',
    'Build static html & assets',
    {
      dest: {
        default: 'out',
        description: 'The output directory'
      }
    },
    function(argv) {
      const pagesDir = path.resolve(cwd, 'pages')
      if (!existsSync(pagesDir)) {
        throw new Error(
          "Couldn't find a `pages` directory. Make sure you have it under the project root"
        )
      }

      const { dest } = argv
      const outDir = path.resolve(cwd, dest)
      // Clean outDir first
      rimraf(outDir, err => {
        if (err) return logger.error(err)
        build(pagesDir, outDir)
      })
    }
  )
  .help().argv
