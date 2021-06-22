import isPageEntry from './isPageEntry'
import path from 'path'
const pagesDir = path.join('/root/path/to/pages')
import { describe, it, expect } from '@jest/globals'
describe('isPageEntry', () => {
  it('should return true for page', () => {
    expect(isPageEntry(pagesDir, path.join(pagesDir, 'index.js'))).toBe(true)
  })
  it('should return false for client side js', () => {
    expect(isPageEntry(pagesDir, path.join(pagesDir, 'index.client.js'))).toBe(
      false
    )
  })
  it('should return false for _app', () => {
    expect(isPageEntry(pagesDir, path.join(pagesDir, '_app.js'))).toBe(false)
  })
})
