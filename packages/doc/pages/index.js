import logo from 'img/voidjs-logo.svg'
import favicon from 'img/favicon.png'
import Content from '../markdown/home.md'
import { Helmet } from 'react-helmet'
export default function Home(props) {
  return (
    <div className="container mx-auto px-5 lg:px-0 ">
      <Helmet>
        <html lang="en" />
        <title>{props.title}</title>
        <meta name="description" content={props.description} />
        <link rel="icon" type="image/png" href={favicon} />
      </Helmet>
      <h1 className="flex text-4xl leading-none justify-start pt-6 lg:text-4xl font-bold font-serif">
        <img
          src={logo}
          alt="voidjs logo"
          className="mr-3 w-10 h-10 capitalize"
        />
        {props.title}
      </h1>
      <h2 className="flex justify-start text-sm pt-0 leading-tight font-normal my-2">
        {props.description}
      </h2>
      <div className="voidjs">
        <Content />
      </div>
    </div>
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
