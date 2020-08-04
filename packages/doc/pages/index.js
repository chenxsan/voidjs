// polyfill for ie 11
import 'react-app-polyfill/ie11'

import 'prismjs/themes/prism-okaidia.css'
import 'css/tailwind.css'
import '@void-js/styles/lib/index.css'
import logo from 'img/voidjs-logo.svg'
import favicon from 'img/favicon.png'
import Footer from '../components/Footer'
import Content from '../markdown/home.md'
import { Helmet } from 'react-helmet'
export default function Home() {
  return (
    <div className="container mx-auto">
      <Helmet>
        <html lang="en" />
        <title>voidjs</title>
        <meta
          name="description"
          content="Manage non-SPA pages with webpack and React.js"
        />
        <link rel="icon" type="image/png" href={favicon} />
      </Helmet>
      <h1 className="flex text-4xl leading-none justify-center pt-6 lg:text-4xl font-bold items-center">
        <img src={logo} alt="voidjs logo" className="mr-3 w-10 h-10" />
        Voidjs
      </h1>
      <h2 className="flex justify-center text-lg pt-0 px-2 leading-tight font-normal">
        Manage non-SPA pages with webpack and React
      </h2>
      <div className="voidjs">
        <Content />
      </div>
      <Footer />
    </div>
  )
}
