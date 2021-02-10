// polyfill for ie 11
import 'react-app-polyfill/ie11'
import { Helmet } from 'react-helmet'
import favicon from 'img/favicon.png'

import 'css/tailwind-base.css'
import 'css/tailwind-components.css'
import 'css/tailwind-utilities.css'
import Refractor from 'react-refractor'
import 'prismjs/themes/prism-okaidia.css'

import { MDXProvider } from '@mdx-js/react'

import js from 'refractor/lang/javascript'
import tsx from 'refractor/lang/tsx'
import bash from 'refractor/lang/bash'

Refractor.registerLanguage(js)
Refractor.registerLanguage(tsx)
Refractor.registerLanguage(bash)

// headings
const h2 = (props) => (
  <h2
    className="font-serif text-red-600 text-4xl mt-20 leading-normal"
    {...props}
  />
)
const h3 = (props) => (
  <h3
    className="font-serif text-red-600 text-2xl mt-10 leading-normal"
    {...props}
  />
)
const p = (props) => <p className="text-base" {...props} />

// lists
const ul = (props) => <ul className="list-disc text-base pl-5" {...props} />
const ol = (props) => <ul className="list-decimal text-base pl-5" {...props} />
const li = (props) => <li className="pl-2" {...props} />

// codes
const inlineCode = (props) => <code className="bg-gray-200 px-2" {...props} />
const pre = (props) => <div className="text-base bg-gray-900" {...props} />
const code = (props) => {
  const { children, className, ...others } = props
  if (typeof className !== 'undefined') {
    return (
      <Refractor
        className=""
        value={children}
        language={className.replace(/^language-/, '')}
        {...others}
      />
    )
  }
  return <code className="bg-gray-200 px-2" {...props} />
}

// link
const a = (props) => (
  <a className="text-blue-700 hover:text-red-700 hover:underline" {...props} />
)
const components = {
  h2,
  h3,
  ul,
  ol,
  inlineCode,
  p,
  pre,
  code,
  a,
}
export default function App({ Component, pageProps }) {
  return (
    <MDXProvider components={components}>
      <div className="container mx-auto px-5 lg:px-0 pb-10 lg:mt-10">
        <Helmet>
          <html lang="en" />
          <link rel="icon" type="image/png" href={favicon} />
          <title>{pageProps.title}</title>
          <meta name="description" content={pageProps.description} />
        </Helmet>
        <Component {...pageProps} />
      </div>
    </MDXProvider>
  )
}
