// polyfill for ie 11
import 'react-app-polyfill/ie11'

import 'prismjs/themes/prism-okaidia.css'
import 'css/tailwind.css'
import '@void-js/styles/lib/index.css'
import { MDXProvider } from '@mdx-js/react'
const h2 = (props) => <h2 className="font-serif" {...props} />
export default function App({ Component, pageProps }) {
  return (
    <MDXProvider components={{ h2 }}>
      <Component {...pageProps} />
    </MDXProvider>
  )
}
