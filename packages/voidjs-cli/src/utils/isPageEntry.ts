import path from 'path'
export default function (pagesDir: string, filename: string): boolean {
  return (
    filename.startsWith(pagesDir) && // only take care of files under pagesDir
    filename.includes('.client.') === false && // exclude client side js
    path.basename(filename).startsWith('_') === false // exclude files like _app as they're special
  )
}
