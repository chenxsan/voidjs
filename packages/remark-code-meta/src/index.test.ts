import remarkCodeMeta from './index'
import remark from 'remark'
import remarkHTML from 'remark-html'
interface Callback {
  (err: Error, { contents: string }): void
}

// ```js filename="index.js" filename="C:\\hello world\\"

describe('remarkCodeMeta', () => {
  describe('filename without whitespace', () => {
    const transform = (callback: Callback, options = {}) => {
      remark().use(remarkCodeMeta, options).use(remarkHTML).process(
        `
\`\`\`js filename=index.js
const answer = 42;
\`\`\``,
        callback
      )
    }
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
  describe('filename with whitespace', () => {
    const transform = (callback: Callback, options = {}) => {
      remark().use(remarkCodeMeta, options).use(remarkHTML).process(
        `
\`\`\`js filename="C:\\code meta\\index.js"
const answer = 42;
\`\`\``,
        callback
      )
    }
    test('should transform code with meta', () => {
      transform(function (err, { contents }) {
        expect(err).toBeNull()
        expect(contents).toMatchSnapshot()
      })
    })
  })

  describe('filename and open', () => {
    const transform = (callback: Callback, options = {}) => {
      remark().use(remarkCodeMeta, options).use(remarkHTML).process(
        `
\`\`\`js filename=index.js open=false
const answer = 42;
\`\`\``,
        callback
      )
    }
    test('should transform code with open set to false', () => {
      transform(function (err, { contents }) {
        expect(err).toBeNull()
        expect(contents).not.toContain('open')
        expect(contents).toMatchSnapshot()
      })
    })
  })
})
