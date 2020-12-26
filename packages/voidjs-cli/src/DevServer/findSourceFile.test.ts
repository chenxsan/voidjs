import findSourceFile from './findSourceFile'
import { vol } from 'memfs'
import path from 'path'
jest.mock('fs')
describe('findRawFile', () => {
  afterEach(() => {
    vol.reset()
  })
  beforeEach(() => {
    vol.fromJSON(
      {
        './index.js': '',
      },
      '/app'
    )
  })
  it('should find raw file', () => {
    const result = findSourceFile('/app', '/index.html')
    expect(result).toEqual({
      src: path.join('/app/index.js'),
      exists: true,
    })
  })
  it('should not find raw file', () => {
    const result = findSourceFile('/app', '/test.html')
    expect(result).toEqual({
      exists: false,
    })
  })
})
