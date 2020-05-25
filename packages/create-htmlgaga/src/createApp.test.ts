import createApp from './createApp'
import { vol } from 'memfs'
jest.mock('fs')
describe('createApp', () => {
  it('should return true', () => {
    expect(true).toBe(true)
  })
  it('process exit with 1', async () => {
    const json = {
      './htmlgaga-app/index.js': 'var a = 123',
    }
    vol.fromJSON(json, '/root')
    const spy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process exit')
    })
    try {
      await createApp('/root/htmlgaga-app')
    } catch (err) {
      expect(err).toEqual(new Error('process exit'))
    }

    expect(spy).toBeCalled()
    expect(spy).toBeCalledWith(1)
  })
})
