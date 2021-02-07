## Pages

All pages in voidjs should be created under `pages` directory, and they should export a named React Function Component.

```js filename=pages/index.js
export default function IndexPage() {
  return <div>hello voidjs</div>
}
```

Note that Class Component is not permitted on purpose, and do not use any React hooks as React in voidjs serves as template only, all behaviors controlled by JavaScript should be delegate to client side JavaScript.

## Client side JavaScript

If you need a little Client side JavaScript code, create a new file, and name it like `index.client.js`:

```js filename=pages/index.client.js
import $ from 'jquery'
$(function () {
  $('body').css('color', 'blue')
})
```

Make sure you follow the naming convention of `[page].client.js`, otherwise it won't work as you expected.

## \_app.js

Once we have many pages, we might want to share the common parts. voidjs supports a customized app where you can share your code among pages.

```js filename=pages/_app.js
import { MDXProvider } from '@mdx-js/react'
const h2 = (props) => (
  <h2
    className="font-serif text-red-600 text-4xl mt-20 leading-tight"
    {...props}
  />
)
const components = {
  h2,
}
export default function App({ Component, pageProps }) {
  return (
    <MDXProvider components={components}>
      <div className="container mx-auto px-5 lg:px-0 pb-5 lg:mt-10">
        <Component {...pageProps} />
      </div>
    </MDXProvider>
  )
}
```

## TypeScript

voidjs has TypeScript support baked-in, which means you can use `.tsx` for your pages, and `.ts` for your client side JavaScript.

## markdown

You can use markdown as well. Just create a new `.md` or `.mdx` file and import it into your page. Everything should work out-of-the-box.
