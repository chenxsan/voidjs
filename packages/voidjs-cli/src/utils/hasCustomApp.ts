import fs from 'fs-extra'
import path from 'path'
export default function hasCustomApp(pagesDir: string): boolean {
  return (
    fs.existsSync(path.join(pagesDir, '_app.tsx')) ||
    fs.existsSync(path.join(pagesDir, '_app.ts')) ||
    fs.existsSync(path.join(pagesDir, '_app.js')) ||
    fs.existsSync(path.join(pagesDir, '_app.jsx')) ||
    fs.existsSync(path.join(pagesDir, '_app.mjs'))
  )
}
