import commander from 'commander'
import chalk from 'chalk'
import createApp from './createApp'
import packageJson from '../package.json'

let projectName = ''

const program = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('[project-directory]')
  .usage(`${chalk.green('[project-directory]')} [options]`)
  .action((name = 'my-app') => {
    projectName = name
  })
  .option('--use-npm', 'use npm instead of yarn', 'false')
  .option(
    '--template <path-to-template>',
    'specify a template for the created project',
    'default'
  )

program.parse(process.argv)

async function run(): Promise<void> {
  const { template, useNpm } = program.opts()
  await createApp(projectName, template, useNpm)
}
run()
