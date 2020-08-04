/**
 * we write client side javascript here
 */
import 'js/css.scss'
window.addEventListener('load', () => {
  import('js/log').then(({ default: log }) => {
    log('voidjs loaded')
  })
})
