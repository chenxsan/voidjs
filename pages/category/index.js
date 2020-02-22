import 'css/tailwind.css'
export default function Page() {
  return <div className="text-black">this is category page</div>
}
if (process.env.NODE_ENV === 'development') {
  if (typeof document !== 'undefined') {
    require('react-dom').render(<Page />, document.querySelector('#app'))
  }
}
