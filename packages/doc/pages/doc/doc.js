import 'prismjs/themes/prism-okaidia.css'
import 'css/tailwind.css'

import Docx from '../../components/doc.md'
import { Helmet } from 'react-helmet'

export default function Doc() {
  return (
    <div>
      <Helmet>
        <title>doc</title>
      </Helmet>
      <Docx />
      <h2 className='font-serif'>Hello Void</h2>
    </div>
  )
}
