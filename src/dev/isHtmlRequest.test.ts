import fn from './isHtmlRequest';

it('should return true with /', () => {
  expect(fn('/')).toBe(true);
});
it('should return true with /index.html', () => {
  expect(fn('/index.html')).toBe(true);
});
it('should return true with /test.html', () => {
  expect(fn('/test.html')).toBe(true);
});

it('should return false with /a.jpg', () => {
  expect(fn('/a.jpg')).toBe(false);
});
