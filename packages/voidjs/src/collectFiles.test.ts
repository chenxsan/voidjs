import collectFiles from './collectFiles'
import { resolve } from 'path'
import { vol } from 'memfs'
jest.mock('fs')
describe('collectFiles', () => {
  afterEach(() => {
    vol.reset()
  })
  test('Found one file', async () => {
    vol.fromJSON({
      [resolve('/pages/hello.tsx')]: '',
    })
    const pages = await collectFiles(resolve('/pages'))
    expect(pages).toEqual([resolve('/pages/hello.tsx')])
  })
  test('Found two files', async () => {
    vol.fromJSON({
      [resolve('/pages/hello.tsx')]: '',
      [resolve('/pages/hi.tsx')]: '',
    })
    const pages = await collectFiles(resolve('/pages'))
    expect(pages.sort()).toEqual([
      resolve('/pages/hello.tsx'),
      resolve('/pages/hi.tsx'),
    ])
  })
  test('Found two files under nested directory', async () => {
    vol.fromJSON({
      [resolve('/pages/blog/hi.tsx')]: '',
      [resolve('/pages/hello.tsx')]: '',
    })
    const pages = await collectFiles(resolve('/pages'))
    expect(pages.sort()).toEqual([
      resolve('/pages/blog/hi.tsx'),
      resolve('/pages/hello.tsx'),
    ])
  })
  test('Found three files under nested directory', async () => {
    vol.fromJSON({
      [resolve('/pages/hello.tsx')]: '',
      [resolve('/pages/blog/hi.tsx')]: '',
      [resolve('/pages/blog/wow.tsx')]: '',
    })
    const pages = await collectFiles(resolve('/pages'))
    expect(pages.sort()).toEqual([
      resolve('/pages/blog/hi.tsx'),
      resolve('/pages/blog/wow.tsx'),
      resolve('/pages/hello.tsx'),
    ])
  })
})
