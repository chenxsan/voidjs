# remark-code-meta

A remark plugin to support meta like `filename` for markdown code block.

Before:

<pre>
```js filename=pages/index.js
export default function IndexPage() {
  return &lt;div>hello voidjs&lt;/div>
}
```
</pre>

After:

<details open>
  <summary>pages/index.js</summary>
<pre>
<code><span>export</span> <span>default</span> <span>function</span> <span>IndexPage</span><span>(</span><span>)</span> <span>{</span>
  <span>return</span> <span>&lt;</span>div<span>&gt;</span>hello voidjs<span>&lt;</span><span>/</span>div<span>&gt;</span>
<span>}</span></code></pre>
</details>

## Usage

```js
import remark from 'remark'
import remarkCodeMeta from 'remark-code-meta'
remark().use(remarkCodeMeta, {})
```

Or

```js
const remark = require('remark')
const { default: remarkCodeMeta } = require('remark-code-meta')
remark().use(remarkCodeMeta, {})
```

## Options

| Option     | Type    | Default              | Description                      |
| ---------- | ------- | -------------------- | -------------------------------- |
| useDetails | boolean | `true`               | use `details`/`summary` elements |
| className  | string  | `'remark-code-meta'` | class to add to element          |

## Supported meta fields

| Meta     | Type    | Default | Description                                                                                              |
| -------- | ------- | ------- | -------------------------------------------------------------------------------------------------------- |
| filename | string  | -       | use `details`/`summary` elements                                                                         |
| open     | boolean | `true`  | set [`open`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details#attributes) for `details` |
