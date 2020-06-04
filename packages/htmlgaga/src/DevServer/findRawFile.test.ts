import findRawFile from './findRawFile'
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
    const result = findRawFile('/app', '/index.html')
    expect(result).toEqual({
      src: path.join('/app/index.js'),
      exists: true,
    })
  })
  it('should not find raw file', () => {
    const result = findRawFile('/app', '/test.html')
    expect(result).toEqual({
      exists: false,
    })
  })
})