/**
 * we write client side javascript here
 */
import './css.scss'
window.addEventListener('load', () => {
  import('./log').then(({ default: log }) => {
    log('htmlgaga loaded')
  })
})
