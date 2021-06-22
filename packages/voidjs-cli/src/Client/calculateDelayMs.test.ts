import calculateDelayMs from './calculateDelayMs'
import { describe, it, expect } from '@jest/globals'
describe('calculateDelayMs', () => {
  it('should return 200', () => {
    const delay = calculateDelayMs(200, 0)
    expect(delay).toBe(200)
  })
  it('should return 400', () => {
    const delay = calculateDelayMs(200, 1)
    expect(delay).toBe(400)
  })
  it('should return 800', () => {
    const delay = calculateDelayMs(200, 2)
    expect(delay).toBe(800)
  })
})
