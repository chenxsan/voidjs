import path from 'path'
import fs from 'fs-extra'
import os from 'os'
import isSafeToCreateProjectIn from './helpers/isSafeToCreateProjectIn'
import install from './helpers/install'
import shouldUseYarn from './helpers/shouldUseYarn'
import chalk from 'chalk'

async function createApp(
  name: string,
  template = 'default',
  useNpm = false
): Promise<void> {
  const root = path.resolve(name)
  const appName = path.basename(root)
  fs.ensureDirSync(name)
  if (!isSafeToCreateProjectIn(root, name)) {
    process.exit(1)
  }
  console.log()

  console.log(`Creating a new htmlgaga app in ${chalk.green(root)}.`)

  const packageJson = {
    name: appName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'htmlgaga dev',
      build: 'htmlgaga build',
    },
  }

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL
  )

  console.log(
    `Installing ${chalk.cyan('htmlgaga')}, ${chalk.cyan(
      'react'
    )} and ${chalk.cyan('react-dom')}...`
  )
  console.log()

  process.chdir(root)
  const useYarn = useNpm ? false : shouldUseYarn()
  const cmd = useYarn ? 'yarn' : 'npm'
  await install(root, ['react', 'react-dom', 'htmlgaga'], { useYarn })
  console.log()

  fs.copySync(path.resolve(__dirname, '..', 'templates', template), root)

  console.log(`${chalk.green('Success!')} Created ${appName} at ${root}`)
  console.log('Inside that directory, you can run several commands:')
  console.log()
  console.log(chalk.cyan(`  ${cmd} ${useYarn ? '' : 'run '}dev`))
  console.log('    Starts the development server.')
  console.log()
  console.log(chalk.cyan(`  ${cmd} ${useYarn ? '' : 'run '}build`))
  console.log('    Builds the app for production.')
  console.log()
}
export default createApp
