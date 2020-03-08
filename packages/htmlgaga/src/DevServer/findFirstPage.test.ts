import fn from './findFirstPage'
it('should return index.js', () => {
  expect(fn(['/users/sam/home/index.js', '/users/sam/home/detail.js'])).toBe(
    '/users/sam/home/index.js'
  )
})
it('should return /child/index.js', () => {
  expect(
    fn(['/users/sam/home/detail.js', '/users/sam/home/child/index.js'])
  ).toBe('/users/sam/home/child/index.js')
})
it('should return the outer one', () => {
  expect(
    fn(['/users/sam/home/a-very-long-file-name.js', '/users/sam/home/a/b.js'])
  ).toBe('/users/sam/home/a-very-long-file-name.js')
})
