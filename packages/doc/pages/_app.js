// polyfill for ie 11
import 'react-app-polyfill/ie11'

import 'css/tailwind-base.css'
import 'css/tailwind-components.css'
import 'css/tailwind-utilities.css'
import 'prismjs/themes/prism-okaidia.css'

// TODO deprecate @void-js/styles as we can customize with mdx
// import '@void-js/styles/lib/index.css'
import { MDXProvider } from '@mdx-js/react'
const h2 = (props) => (
  <h2 className="font-serif text-red-600 text-4xl mt-20" {...props} />
)
const p = (props) => <p className="text-base" {...props} />
const ul = (props) => <ul className="list-disc text-base pl-5" {...props} />
const ol = (props) => <ul className="list-decimal text-base pl-5" {...props} />
const li = (props) => <li className="pl-2" {...props} />
const inlineCode = (props) => <code className="bg-gray-200 px-2" {...props} />
const pre = (props) => <pre className="text-base" {...props} />
const components = {
  h2,
  ul,
  ol,
  inlineCode,
  p,
  pre,
}
export default function App({ Component, pageProps }) {
  return (
    <MDXProvider components={components}>
      <Component {...pageProps} />
    </MDXProvider>
  )
}
