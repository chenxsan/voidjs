import React from 'react'
import '../src/index.scss'
import Body from '../markdown/body.md'
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
        htmlgaga styles for markdown
      </header>
      <section>
        <Body />
      </section>
    </div>
  )
}
