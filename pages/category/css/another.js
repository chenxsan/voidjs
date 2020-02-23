export default function Page() {
  return <div>this is another css page</div>
}
if (process.env.NODE_ENV === 'development') {
  require('react-dom').render(<Page />, document.querySelector('#app'))
}
