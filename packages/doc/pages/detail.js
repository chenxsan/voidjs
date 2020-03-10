import 'css/tailwind.css'
import 'css/styles.css'
import Cat from '../components/Cat'
export default function DetailPage() {
  const Cats = [...Array(8).keys()].map(v => (
    <Cat key={v} src={`../fixture/cat${v + 1}.jpg`} />
  ))
  return (
    <div className="">
      <h2 className="py-6 text-2xl text-center text-black-500 font-medium lg:text-4xl">
        All the cats
      </h2>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3">
        {Cats}
      </div>
    </div>
  )
}
