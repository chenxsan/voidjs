import React from 'react'
import '../src/index.scss'
import Body from '../markdown/body.mdx'
export default function Index(): React.ReactNode {
  return (
    <div className="htmlgaga">
      <header
        style={{
          textAlign: 'center',
          fontSize: 28,
          padding: '20px 0',
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
