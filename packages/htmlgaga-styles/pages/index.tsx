import React from 'react'
import '../src/index.scss'
import 'css/page.css'
import Body from '../markdown/body.mdx'
export default function Index(): React.ReactNode {
  return (
    <div className="htmlgaga">
      <header
        style={{
          textAlign: 'center',
          fontSize: 28,
          padding: '40px 0',
          background: '#000',
          color: '#fff',
        }}
      >
        Style guide for markdown content
      </header>
      <section>
        <Body />
      </section>
    </div>
  )
}
