import spawn from 'cross-spawn'
import checkIfOnline from '../helpers/checkIfOnline'
import chalk from 'chalk'
export default function install(
  root: string,
  dependencies: string[] = [],
  { useYarn }
): Promise<void> {
  return checkIfOnline(useYarn).then((isOnline: boolean) => {
    return new Promise((resolve, reject) => {
      let command: string
      let args: string[]
      if (useYarn) {
        command = 'yarnpkg'
        args = ['add', '--exact', '--dev']
        if (!isOnline) {
          args.push('--offline')
        }
        args.push(...dependencies)
        args.push('--cwd')
        args.push(root)

        if (!isOnline) {
          console.log(chalk.yellow('You appear to be offline.'))
          console.log(chalk.yellow('Falling back to the local Yarn cache.'))
          console.log()
        }
      } else {
        command = 'npm'
        args = [
          'install',
          '--save-dev',
          '--save-exact',
          '--loglevel',
          'error'
        ].concat(dependencies)
      }
      const child = spawn(command, args, {
        stdio: 'inherit'
      })
      child.on('close', code => {
        if (code !== 0) {
          reject({ command: `${command} ${args.join(' ')}` })
          return
        }
        resolve()
      })
    })
  })
}
