import * as path from 'path'
import fn from './getEntryKeyFromRelativePath'
const { resolve } = path
test('should remove file ext from index', () => {
  expect(fn(resolve('/root/pages'), resolve('/root/pages/index.js'))).toBe(
    ['index', 'index'].join(path.sep)
  )
})
test('should create dir from filename', () => {
  expect(fn(resolve('/root/pages'), resolve('/root/pages/detail.js'))).toBe(
    ['detail', 'index'].join(path.sep)
  )
})
