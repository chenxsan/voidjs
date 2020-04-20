import 'css/tailwind.css'
import logo from 'img/logo.svg'
import Pre from '../components/Pre'
import P from '../components/P'
import Footer from '../components/Footer'
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
        Manage non-SPA pages with webpack and React.js
      </h2>
      <section className="pt-8 px-0 sm:px-2">
        <h2 className="font-medium text-2xl">System requirements</h2>
        <ol>
          <li className="list-disc list-inside">Node.js 10 or later</li>
          <li className="list-disc list-inside">
            MacOS, Windows and Linux are supported
          </li>
        </ol>
      </section>
      <section className="pt-8 px-0 sm:px-2">
        <h2 className="font-medium text-2xl">Get started</h2>
        <P>To create a new htmlgaga project, run command:</P>
        <Pre>
          <code>npm init htmlgaga</code>
        </Pre>
        <P>If you are using yarn 1.x, run this instead:</P>
        <Pre>
          <code>yarn create htmlgaga</code>
        </Pre>
        <P>If you are using yarn 2.x, run this instead:</P>
        <Pre>
          <code>yarn dlx create-htmlgaga</code>
        </Pre>
      </section>
      <Footer />
    </div>
  )
}
