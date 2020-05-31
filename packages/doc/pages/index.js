import 'prismjs/themes/prism-okaidia.css'
import 'css/tailwind.css'
import logo from 'img/logo.svg'
import Footer from '../components/Footer'
import Content from '../markdown/home.md'
import { Helmet } from 'react-helmet'
export default function Home() {
  return (
    <div className="container mx-auto">
      <Helmet>
        <html lang="en" />
        <title>htmlgaga</title>
        <meta
          name="description"
          content="Manage non-SPA pages with webpack and React.js"
        />
      </Helmet>
      <h1 className="flex text-4xl leading-none justify-center pt-6 lg:text-4xl font-bold items-center">
        <img src={logo} alt="htmlgaga logo" className="mr-3 w-10 h-10" />
        HTMLgaga
      </h1>
      <h2 className="flex justify-center text-base pt-6 px-2 leading-tight font-normal">
        Manage non-SPA pages with webpack and React
      </h2>
      <Content />
      <Footer />
    </div>
  )
}
