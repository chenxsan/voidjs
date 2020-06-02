import fn from './normalizeAssetPath'
describe('normalizeAssetPath', () => {
  afterEach(() => {
    delete process.env.ASSET_PATH
  })
  it('should return undefined', () => {
    expect(fn()).toBeUndefined()
  })
  it('should return value from process.env.ASSET_PATH', () => {
    process.env.ASSET_PATH = 'https://htmlgaga.com/'
    expect(fn()).toBe('https://htmlgaga.com/')
  })
  it('should append / to process.env.ASSET_PATH', () => {
    process.env.ASSET_PATH = 'https://htmlgaga.com'
    expect(fn()).toBe('https://htmlgaga.com/')
  })
})
