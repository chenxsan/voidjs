import Content from '../markdown/home.md'
import Navbar from '../components/Navbar'
function Menu({ href, text }) {
  return (
    <a
      href={href}
      className="text-blue-700 hover:text-red-700 hover:underline transition-colors duration-200 text-base"
    >
      {text}
    </a>
  )
}

export default function Home(props) {
  return (
    <>
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
