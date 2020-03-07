import fn from './findFirstPage';
it('should return index.js', () => {
  expect(fn(['/users/sam/home/index.js', '/users/sam/home/detail.js'])).toBe(
    '/users/sam/home/index.js'
  );
});
it('should return /child/index.js', () => {
  expect(
    fn(['/users/sam/home/detail.js', '/users/sam/home/child/index.js'])
  ).toBe('/users/sam/home/child/index.js');
});
