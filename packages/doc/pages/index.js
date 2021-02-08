import favicon from 'img/favicon.png'
import Content from '../markdown/home.md'
import { Helmet } from 'react-helmet'
import Navbar from '../components/Navbar'
function Menu({ href, text }) {
  return (
    <a
      href={href}
      className="text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-200 text-base"
    >
      {text}
    </a>
  )
}

export default function Home(props) {
  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>{props.title}</title>
        <meta name="description" content={props.description} />
        <link rel="icon" type="image/png" href={favicon} />
      </Helmet>
      <Navbar {...props} />
      <nav className="space-x-3">
        <Menu text="Guides" href="/guides/" />
      </nav>
      <div className="voidjs">
        <Content />
      </div>
    </>
  )
}
export async function getStaticProps() {
  return {
    props: {
      title: 'voidjs',
      description: 'Manage non-SPA pages with webpack and React',
    },
  }
}
