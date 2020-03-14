import 'css/tailwind.css'
import Pre from '../components/Pre'
import P from '../components/P'
import Footer from '../components/Footer'
export default function Home() {
  return (
    <div className="container mx-auto">
      <h1 className="flex text-4xl leading-none justify-center pt-4 lg:text-4xl font-bold">
        htmlgaga
      </h1>
      <h2 className="flex justify-center text-base pt-2 px-2 leading-tight font-normal">
        Manage multiple non-SPA pages with webpack and React.js
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
          <code>yarn dlx htmlgaga</code>
        </Pre>
      </section>
      <Footer />
    </div>
  )
}
export const title = 'htmlgaga'
