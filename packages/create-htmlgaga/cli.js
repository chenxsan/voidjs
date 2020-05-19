#!/usr/bin/env node

const nodeVersion = process.versions.node
const major = nodeVersion.split('.')[0]

if (major < 12) {
  console.error(
    'You are running Node ' +
      nodeVersion +
      '.\n' +
      'Htmlgaga requires Node 12 or higher. \n' +
      'Please update your version of Node.'
  )
  process.exit(1)
}

require('./dist/create-htmlgaga.cjs.js')
