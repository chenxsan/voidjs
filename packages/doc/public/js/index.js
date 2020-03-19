/**
 * we write client side javascript here
 */
window.addEventListener('load', () => {
  import('./log').then(({ default: log }) => {
    log('htmlgaga loaded')
  })
})
