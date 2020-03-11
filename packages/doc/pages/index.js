import 'css/tailwind.css'

export default function Home() {
  return (
    <div className="">
      <h1 className="flex text-3xl leading-none justify-center pt-4 lg:text-4xl font-bold">
        htmlgaga
      </h1>
      <h2 className="flex justify-center text-base pt-2 px-2 leading-tight font-normal">
        Manage multiple non-SPA pages with webpack and React.js
      </h2>
      <section className="pt-4 px-2">
        <h2 className="font-medium text-xl">Get started</h2>
        <ol className="list-decimal list-inside">
          <li>
            Install <code>htmlgaga</code>:
            <pre>$ npm install htmlgaga --save-dev</pre>
          </li>
          <li>
            Add npm scripts to <code>package.json</code>:
            <pre>
              <code>
                {`
              {
                scripts: {
                  dev: "htmlgaga dev",
                  build: "htmlgaga build"
                }
              }
              `}
              </code>
            </pre>
          </li>
          <li>
            Create <code>index.js</code> file under <code>pages</code> directory
            and add code{' '}
            <code>{`import React from 'react'; export default function IndexPage() {return <div>hello htmlgaga</div>}`}</code>
          </li>
          <li>
            Run <code>npm run dev</code> to start development server.
          </li>
        </ol>
      </section>
    </div>
  )
}
