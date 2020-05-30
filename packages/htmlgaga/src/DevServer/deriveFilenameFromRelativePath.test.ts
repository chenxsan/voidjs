import fn from './deriveFilenameFromRelativePath'
test('should return index.html', () => {
  expect(fn('/root/pages', '/root/pages/index.js')).toBe('index.html')
})
test('should return detail/index.html', () => {
  expect(fn('/root/pages', '/root/pages/detail.js')).toBe('detail.html')
})
