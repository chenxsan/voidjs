import remarkCodeMeta from './index'
import remark from 'remark'
import remarkHTML from 'remark-html'
interface Callback {
  (err: Error, { contents: string }): void
}
const transform = (callback: Callback, options = {}) => {
  remark().use(remarkCodeMeta, options).use(remarkHTML).process(
    `
\`\`\`js filename=index.js
const answer = 42;
\`\`\``,
    callback
  )
}
describe('remarkCodeMeta', () => {
  test('should transform code with meta', () => {
    transform(function (err, { contents }) {
      expect(err).toBeNull()
      expect(contents).toMatchSnapshot()
    })
  })
  test('should customize className', () => {
    transform(
      function (err, { contents }) {
        expect(err).toBeNull()
        expect(contents).toContain('voidjs__filename')
        expect(contents).toMatchSnapshot()
      },
      {
        className: 'voidjs',
      }
    )
  })
  test('should customize useDetails', () => {
    transform(
      function (err, { contents }) {
        expect(err).toBeNull()
        expect(contents).not.toContain('details')
        expect(contents).not.toContain('summary')
        expect(contents).toMatchSnapshot()
      },
      {
        useDetails: false,
      }
    )
  })
})
