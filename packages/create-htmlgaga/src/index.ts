import commander from 'commander'
import prompts from 'prompts'
import validate from 'validate-npm-package-name'
import chalk from 'chalk'
import createApp from './createApp'
import packageJson from '../package.json'
import checkForUpdate from 'update-check'

let projectName = ''

const program = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action(name => {
    projectName = name
  })
  .option('--use-npm')
  .option(
    '--template <path-to-template>',
    'specify a template for the created project'
  )
  .allowUnknownOption()
  .parse(process.argv)

async function run(): Promise<void> {
  let update = null
  try {
    update = await checkForUpdate(packageJson)
  } catch (err) {
    //
  }

  if (update) {
    console.log(
      chalk.yellow.bold('A new version of `create-htmlgaga` is available!')
    )
  }

  if (projectName === '') {
    // ask user to input projectName
    const response = await prompts({
      type: 'text',
      name: 'path',
      message: 'What is your project name?',
      initial: 'my-app',
      validate: name => {
        const validation = validate(name)
        if (validation.validForNewPackages) {
          return true
        }
        return `Invalid project name: ${validation.errors &&
          validation.errors[0]}`
      }
    })
    projectName = response.path
  }
  await createApp(projectName, program.template, program.useNpm)
}
run()
