import fs from 'fs-extra'
import path from 'path'
const cache = {}
export default function hasCustomApp(pagesDir: string): boolean {
  // return if stored in cache
  if (cache[pagesDir]) return cache[pagesDir]

  // otherwise store the result in cache
  cache[pagesDir] =
    fs.existsSync(path.join(pagesDir, '_app.tsx')) ||
    fs.existsSync(path.join(pagesDir, '_app.ts')) ||
    fs.existsSync(path.join(pagesDir, '_app.js')) ||
    fs.existsSync(path.join(pagesDir, '_app.jsx')) ||
    fs.existsSync(path.join(pagesDir, '_app.mjs'))
  return cache[pagesDir]
}
