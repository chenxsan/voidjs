export default function Page() {
  return <div>this is css page</div>
}
if (process.env.NODE_ENV === 'development') {
  if (typeof document !== 'undefined') {
    require('react-dom').render(<Page />, document.querySelector('#app'))
  }
}
