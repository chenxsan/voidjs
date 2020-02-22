import logo from 'img/logo@3x.svg'
export default function Page() {
  return (
    <div>
      this is signin page
      <img src={logo} />
    </div>
  )
}
if (process.env.NODE_ENV === 'development') {
  if (typeof document !== 'undefined') {
    require('react-dom').render(<Page />, document.querySelector('#app'))
  }
}
