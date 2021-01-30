import Docx from '../../components/doc.md'
import { Helmet } from 'react-helmet'

export default function Doc() {
  return (
    <div>
      <Helmet>
        <title>doc</title>
      </Helmet>
      <Docx />
      <h2>Hello Void</h2>
    </div>
  )
}
