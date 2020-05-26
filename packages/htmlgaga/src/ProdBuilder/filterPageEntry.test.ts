import { filterPageEntry } from './index'
const exts = 'mjs,js,jsx,ts,tsx,md,mdx'
const clientSuffix = '.client'
describe('filterPageEntry', () => {
  it('should pass for page entry', () => {
    exts.split(',').forEach((ext) => {
      expect(filterPageEntry(`/app/index.${ext}`)).toBe(true)
    })
    exts.split(',').forEach((ext) => {
      expect(filterPageEntry(`/app/index${clientSuffix}.hello.${ext}`)).toBe(
        true
      )
    })
  })
  it('should fail for client side JavaScript entry', () => {
    exts.split(',').forEach((ext) => {
      expect(filterPageEntry(`/app/index${clientSuffix}.${ext}`)).toBe(false)
    })
  })
})
