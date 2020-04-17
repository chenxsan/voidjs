import collectFiles from './collectFiles'
import { vol } from 'memfs'
jest.mock('fs')
describe('collectFiles', () => {
  afterEach(() => {
    vol.reset()
  })
  test('Found one file', async () => {
    vol.fromJSON({
      '/pages/hello.tsx': ''
    })
    const pages = await collectFiles('/pages')
    expect(pages).toEqual(['/pages/hello.tsx'])
  })
  test('Found two files', async () => {
    vol.fromJSON({
      '/pages/hello.tsx': '',
      '/pages/hi.tsx': ''
    })
    const pages = await collectFiles('/pages')
    expect(pages.sort()).toEqual(['/pages/hello.tsx', '/pages/hi.tsx'])
  })
  test('Found two files under nested directory', async () => {
    vol.fromJSON({
      '/pages/blog/hi.tsx': '',
      '/pages/hello.tsx': ''
    })
    const pages = await collectFiles('/pages')
    expect(pages.sort()).toEqual(['/pages/blog/hi.tsx', '/pages/hello.tsx'])
  })
  test('Found three files under nested directory', async () => {
    vol.fromJSON({
      '/pages/hello.tsx': '',
      '/pages/blog/hi.tsx': '',
      '/pages/blog/wow.tsx': ''
    })
    const pages = await collectFiles('/pages')
    expect(pages.sort()).toEqual([
      '/pages/blog/hi.tsx',
      '/pages/blog/wow.tsx',
      '/pages/hello.tsx'
    ])
  })
})
