#!/usr/bin/env node

const yargs = require('yargs')
const server = require('./server')
const build = require('./build')

yargs
  .scriptName('htmlgaga')
  .usage(`$0 <cmd> [args]`)
  .command(
    'dev',
    'Run development server',
    function() {},
    function() {
      server().listen(8080, '127.0.0.1', () => {
        console.log('Starting server on http://localhost:8080')
      })
    }
  )
  .command(
    'build [src]',
    'Build static html & assets',
    {
      src: {
        default: 'pages',
        description: 'the directory holds our pages'
      }
    },
    function(argv) {
      const { src } = argv
      build(src)
    }
  )
  .help().argv
