import createApp from './createApp'
import { vol } from 'memfs'

import { describe, expect } from '@jest/globals'

jest.mock('fs')
describe('createApp', () => {
  afterEach(() => {
    vol.reset()
  })
  it('should exit process with code 1', async () => {
    const json = {
      './voidjs-app/index.js': 'var a = 123',
    }
    vol.fromJSON(json, '/root')
    const spy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process exit')
    })
    try {
      await createApp('/root/voidjs-app')
    } catch (err) {
      expect(err).toEqual(new Error('process exit'))
    }

    expect(spy).toBeCalled()
    expect(spy).toBeCalledWith(1)
  })
})
