import collectFiles from './collectFiles'
import { join } from 'path'
import { vol } from 'memfs'
jest.mock('fs')
describe('collectFiles', () => {
  afterEach(() => {
    vol.reset()
  })
  test('Found one file', async () => {
    vol.fromJSON({
      [join('/pages/hello.tsx')]: '',
    })
    const pages = await collectFiles(join('/pages'))
    expect(pages).toEqual([join('/pages/hello.tsx')])
  })
  test('Found two files', async () => {
    vol.fromJSON({
      [join('/pages/hello.tsx')]: '',
      [join('/pages/hi.tsx')]: '',
    })
    const pages = await collectFiles(join('/pages'))
    expect(pages.sort()).toEqual([
      join('/pages/hello.tsx'),
      join('/pages/hi.tsx'),
    ])
  })
  test('Found two files under nested directory', async () => {
    vol.fromJSON({
      [join('/pages/blog/hi.tsx')]: '',
      [join('/pages/hello.tsx')]: '',
    })
    const pages = await collectFiles(join('/pages'))
    expect(pages.sort()).toEqual([
      join('/pages/blog/hi.tsx'),
      join('/pages/hello.tsx'),
    ])
  })
  test('Found three files under nested directory', async () => {
    vol.fromJSON({
      [join('/pages/hello.tsx')]: '',
      [join('/pages/blog/hi.tsx')]: '',
      [join('/pages/blog/wow.tsx')]: '',
    })
    const pages = await collectFiles(join('/pages'))
    expect(pages.sort()).toEqual([
      join('/pages/blog/hi.tsx'),
      join('/pages/blog/wow.tsx'),
      join('/pages/hello.tsx'),
    ])
  })
})
