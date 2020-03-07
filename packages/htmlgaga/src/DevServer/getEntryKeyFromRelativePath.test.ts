import * as path from 'path'
import fn from './getEntryKeyFromRelativePath'
test('should remove file ext from index', () => {
  expect(fn('/root/pages', '/root/pages/index.js')).toBe(
    ['index', 'index'].join(path.sep)
  )
})
test('should create dir from filename', () => {
  expect(fn('/root/pages', '/root/pages/detail.js')).toBe(
    ['detail', 'index'].join(path.sep)
  )
})
