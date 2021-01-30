// polyfill for ie 11
import 'react-app-polyfill/ie11'

import 'prismjs/themes/prism-okaidia.css'
import 'css/tailwind-base.css'
import 'css/tailwind-components.css'
import 'css/tailwind-utilities.css'
// TODO deprecate @void-js/styles as we can customize with mdx
import '@void-js/styles/lib/index.css'
import { MDXProvider } from '@mdx-js/react'
const h2 = (props) => <h2 className="font-serif text-red-600" {...props} />
const ul = (props) => <ul className="list-disc list-inside" {...props} />
const components = {
  h2,
  ul,
}
export default function App({ Component, pageProps }) {
  return (
    <MDXProvider components={components}>
      <Component {...pageProps} />
    </MDXProvider>
  )
}
