/**
 * Copyright 2020-present, Sam Chen.
 * 
 * Licensed under GPL-3.0-or-later
 * 
 * This file is part of htmlgaga.

    htmlgaga is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    htmlgaga is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with htmlgaga.  If not, see <https://www.gnu.org/licenses/>.
 */
import yargs from 'yargs'
import rimraf from 'rimraf'
import { existsSync } from 'fs'
import * as path from 'path'
import { logger, cwd } from './config'
import DevServer from './DevServer'
import type { Server } from './DevServer'
import Builder from './ProdBuilder'

interface DevCmdArgs {
  host: string
  port: number
}

interface BuildCmdArgs {
  dest: string
}

yargs
  .scriptName('htmlgaga')
  .usage(`$0 <cmd> [args]`)
  .command(
    'dev',
    'Run development server',
    {
      host: {
        default: 'localhost',
        description: 'Host to run server',
      },
      port: {
        default: 8080,
        description: 'Port to run server',
      },
    },
    async function (argv: DevCmdArgs) {
      const { host, port } = argv
      const pagesDir = path.resolve(cwd, 'pages')
      const server: Server = new DevServer(pagesDir, { host, port })
      server.start()
    }
  )
  .command(
    'build',
    'Build static html & assets',
    {
      dest: {
        default: 'out',
        description: 'The output directory',
      },
    },
    function (argv: BuildCmdArgs) {
      const pagesDir = path.resolve(cwd, 'pages')
      if (!existsSync(pagesDir)) {
        throw new Error(
          "Couldn't find a `pages` directory. Make sure you have it under the project root"
        )
      }

      const { dest } = argv
      const outDir = path.resolve(cwd, dest)

      // Clean outDir first
      rimraf(outDir, async (err) => {
        if (err) return logger.error(err)
        // remove .htmlgaga folder
        rimraf(path.resolve(cwd, '.htmlgaga'), async (err) => {
          if (err) return logger.error(err)
          const builder = new Builder(pagesDir, outDir)
          process.env['NODE_ENV'] = 'production'
          await builder.run()
        })
      })
    }
  )
  .help().argv
