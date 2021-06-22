import fn from './deriveFilenameFromRelativePath'
import { test, expect } from '@jest/globals'

test('should return index.html', () => {
  expect(fn('/root/pages', '/root/pages/index.js')).toBe('index.html')
})
test('should return detail/index.html', () => {
  expect(fn('/root/pages', '/root/pages/detail.js')).toBe('detail.html')
})
