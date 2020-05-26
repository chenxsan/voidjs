import spawn from 'cross-spawn'
export default function install(
  root: string,
  dependencies: string[] = [],
  { useYarn }
): Promise<void> {
  return new Promise((resolve, reject) => {
    let command: string
    let args: string[]
    if (useYarn) {
      command = 'yarn'
      args = ['add', '--exact', '--dev']
      args.push(...dependencies)
      args.push('--cwd')
      args.push(root)
    } else {
      command = 'npm'
      args = [
        'install',
        '--save-dev',
        '--save-exact',
        '--loglevel',
        'error',
      ].concat(dependencies)
    }
    const child = spawn(command, args, {
      stdio: 'inherit',
    })
    child.on('close', (code) => {
      if (code !== 0) {
        reject({ command: `${command} ${args.join(' ')}` })
        return
      }
      resolve()
    })
  })
}
