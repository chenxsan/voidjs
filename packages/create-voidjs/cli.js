#!/usr/bin/env node

const nodeVersion = process.versions.node
const major = nodeVersion.split('.')[0]

const minVersion = 12

if (major < minVersion) {
  console.error(
    'You are running Node ' +
      nodeVersion +
      '.\n' +
      `Voidjs requires Node ${minVersion} or higher. \n` +
      'Please update your version of Node.'
  )
  process.exit(1)
}

require('./dist/create-voidjs.cjs.js')
