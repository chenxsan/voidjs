jest.mock('fs', () => new (require('metro-memory-fs'))())
const fs = require('fs')
const path = require('path')
const collectPages = require('./collectPages')
describe('collectPages', () => {
  beforeEach(() => {
    fs.reset()
    fs.mkdirSync('/pages')
  })
  test('Found one file', () => {
    fs.writeFileSync('/pages/hello.tsx', '')
    expect(collectPages(path.resolve('/pages'))).toEqual(['/pages/hello.tsx'])
  })
  test('Found two files', () => {
    fs.writeFileSync('/pages/hello.tsx', '')
    fs.writeFileSync('/pages/hi.tsx', '')
    expect(collectPages(path.resolve('/pages')).sort()).toEqual([
      '/pages/hello.tsx',
      '/pages/hi.tsx'
    ])
  })
  test('Found two files under nested directory', () => {
    fs.mkdirSync('/pages/blog')
    fs.writeFileSync('/pages/hello.tsx', '')
    fs.writeFileSync('/pages/blog/hi.tsx', '')
    expect(collectPages(path.resolve('/pages')).sort()).toEqual([
      '/pages/blog/hi.tsx',
      '/pages/hello.tsx'
    ])
  })
  test('Found three files under nested directory', () => {
    fs.mkdirSync('/pages/blog')
    fs.writeFileSync('/pages/hello.tsx', '')
    fs.writeFileSync('/pages/blog/hi.tsx', '')
    fs.writeFileSync('/pages/blog/wow.tsx', '')
    expect(collectPages(path.resolve('/pages')).sort()).toEqual([
      '/pages/blog/hi.tsx',
      '/pages/blog/wow.tsx',
      '/pages/hello.tsx'
    ])
  })
})
