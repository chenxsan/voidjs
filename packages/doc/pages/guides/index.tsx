import React from 'react'
import Navbar from '../../components/Navbar'
import Body from '../../markdown/guides.md'
export default function Guides(): React.ReactElement {
  return (
    <>
      <Navbar />
      <Body />
    </>
  )
}
interface StaticProps {
  props: {
    title: string
    description: string
  }
}
export async function getStaticProps(): Promise<StaticProps> {
  return {
    props: {
      title: 'Guides for voidjs',
      description: 'How to get started with voidjs, features, etc.',
    },
  }
}
