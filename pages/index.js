import 'css/tailwind.css'

// there're two types of image
// one is part of the template
// we should just import it
// so webpack could manage for us
import logo from 'img/logo@3x.svg'

export default function Page() {
  return (
    <div className="">
      <h1 className="flex items-center text-2xl leading-none justify-center py-10 lg:text-4xl">
        <img
          src={logo}
          className="transform -rotate-90 mr-1 w-8 h-8"
          alt="logo"
        />
        Cat has home page
      </h1>
      {/* image for placeholder purpose, don't import it */}
      {/* or webpack would build it */}
      <img
        src="../placeholder/cat.jpg"
        alt="cat"
        id="cover"
        className="transform transition duration-300 max-w-6xl block mx-auto origin-top w-full select-none"
        style={{
          willChange: 'transform'
        }}
      />
    </div>
  )
}
