import findRawFile from './findRawFile'
import { vol } from 'memfs'
jest.mock('fs')
describe('findRawFile', () => {
  afterEach(() => {
    vol.reset()
  })
  it('should find raw file', () => {
    vol.fromJSON(
      {
        './index.js': '',
      },
      '/app'
    )
    const result = findRawFile('/app', '/index.html')
    expect(result).toEqual({
      src: '/app/index.js',
      exists: true,
    })
  })
  it('should not find raw file', () => {
    vol.fromJSON(
      {
        './index.js': '',
      },
      '/app'
    )
    const result = findRawFile('/app', '/test.html')
    expect(result).toEqual({
      exists: false,
    })
  })
})
