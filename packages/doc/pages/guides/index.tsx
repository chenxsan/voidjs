import React from 'react'
import Navbar from '../../components/Navbar'
import Body from '../../markdown/guides.md'
interface Props {}
export default function Guides(props: Props): React.ReactElement {
  return (
    <>
      <Navbar />
      <Body />
    </>
  )
}
export async function getStaticProps(): Promise {
  return {
    props: {
      title: 'Guides for voidjs',
      description: 'How to get started with voidjs, features, etc.',
    },
  }
}
