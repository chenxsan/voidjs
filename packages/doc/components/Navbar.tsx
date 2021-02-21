import React from 'react'
const logo = new URL('img/voidjs-logo.svg', import.meta.url)
export default function Navbar(): React.ReactElement {
  return (
    <>
      <h1 className="flex text-4xl leading-none justify-start pt-6 lg:text-4xl font-bold font-serif">
        <a href="/">
          <img
            src={logo}
            alt="voidjs logo"
            width={588}
            height={588}
            className="mr-3 w-10 h-10 capitalize"
          />
        </a>
        {'voidjs'}
      </h1>
      <h2 className="flex justify-start text-sm pt-0 leading-tight font-normal my-2">
        {'Manage non-SPA pages with webpack and React'}
      </h2>
    </>
  )
}
