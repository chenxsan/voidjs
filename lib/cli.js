#!/usr/bin/env node

const yargs = require('yargs')
const build = require('./build')

yargs
  .scriptName('htmlgaga')
  .usage(`$0 <cmd> [args]`)
  .command(
    'dev',
    'Run development server',
    function() {},
    function(argv) {
      console.log(argv)
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
