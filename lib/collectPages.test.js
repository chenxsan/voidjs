jest.mock('fs', () => new (require('metro-memory-fs'))())

const fs = require('fs')
const path = require('path')
const collectPages = require('./collectPages')

describe('collectPages', () => {
  beforeEach(() => {
    fs.reset()
    fs.mkdirSync('/pages')
  })
  test('Found one file', async () => {
    fs.writeFileSync('/pages/hello.tsx', '')
    const pages = await collectPages(path.resolve('/pages'))
    expect(pages).toEqual(['/pages/hello.tsx'])
  })
  test('Found two files', async () => {
    fs.writeFileSync('/pages/hello.tsx', '')
    fs.writeFileSync('/pages/hi.tsx', '')
    const pages = await collectPages(path.resolve('/pages'))
    expect(pages.sort()).toEqual(['/pages/hello.tsx', '/pages/hi.tsx'])
  })
  test('Found two files under nested directory', async () => {
    fs.mkdirSync('/pages/blog')
    fs.writeFileSync('/pages/hello.tsx', '')
    fs.writeFileSync('/pages/blog/hi.tsx', '')
    const pages = await collectPages(path.resolve('/pages'))
    expect(pages.sort()).toEqual(['/pages/blog/hi.tsx', '/pages/hello.tsx'])
  })
  test('Found three files under nested directory', async () => {
    fs.mkdirSync('/pages/blog')
    fs.writeFileSync('/pages/hello.tsx', '')
    fs.writeFileSync('/pages/blog/hi.tsx', '')
    fs.writeFileSync('/pages/blog/wow.tsx', '')
    const pages = await collectPages(path.resolve('/pages'))
    expect(pages.sort()).toEqual([
      '/pages/blog/hi.tsx',
      '/pages/blog/wow.tsx',
      '/pages/hello.tsx'
    ])
  })
})
