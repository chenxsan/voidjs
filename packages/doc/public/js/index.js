/**
 * we write client side javascript here
 */
document.querySelector('#cover')?.addEventListener('click', function() {
  import('./log').then(({ default: log }) => {
    log('you just click the cat!')
  })
})
