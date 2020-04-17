import DevServer from './index'
import { vol } from 'memfs'
jest.mock('fs')
const serverInfo = {
  host: 'localhost',
  port: 8000,
}
describe('DevServer locateSrc method', () => {
  afterEach(() => {
    vol.reset()
  })
  it('should find index.js', () => {
    vol.fromJSON({
      '/project/a/pages/index.js': '',
    })
    const server = new DevServer('/project/a/pages', serverInfo)
    expect(server.locateSrc('/index.html')).toEqual({
      exists: true,
      src: '/project/a/pages/index.js',
    })
    expect(server.locateSrc('/')).toEqual({
      exists: true,
      src: '/project/a/pages/index.js',
    })
  })
  it('should find dir/index.tsx', () => {
    vol.fromJSON({
      '/project/a/pages/dir/index.tsx': '',
      '/project/a/pages/dir/index.js': '',
    })
    const server = new DevServer('/project/a/pages', serverInfo)
    expect(server.locateSrc('/dir/')).toEqual({
      exists: true,
      src: '/project/a/pages/dir/index.tsx',
    })
  })
  it('should find nothing', () => {
    vol.fromJSON({
      '/project/a/pages/index.js': '',
    })
    const server = new DevServer('/project/a/pages', serverInfo)
    expect(server.locateSrc('/test.html')).toEqual({
      exists: false,
    })
  })
})
