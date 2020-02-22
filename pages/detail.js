import 'css/tailwind.css'
export default function Page() {
  return <div className="flex text-blue-500">this is detail</div>
}
if (process.env.NODE_ENV === 'development') {
  if (typeof document !== 'undefined') {
    require('react-dom').render(<Page />, document.querySelector('#app'))
  }
}
