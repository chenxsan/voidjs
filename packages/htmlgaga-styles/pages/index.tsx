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
          textTransform: 'uppercase'
        }}
      >
        htmlgaga styles
      </header>
      <section>
        <Body />
      </section>
    </div>
  )
}
