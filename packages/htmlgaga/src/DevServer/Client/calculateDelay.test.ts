import calculateDelay from './calculateDelay'
describe('calculateDelay', () => {
  it('should return 200', () => {
    const delay = calculateDelay(200, 0)
    expect(delay).toBe(200)
  })
  it('should return 400', () => {
    const delay = calculateDelay(200, 1)
    expect(delay).toBe(400)
  })
  it('should return 800', () => {
    const delay = calculateDelay(200, 2)
    expect(delay).toBe(800)
  })
})
