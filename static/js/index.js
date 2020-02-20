/**
 * we write client side javascript here
 */
document.querySelector('#cover')?.addEventListener('click', function(e) {
  import('./log').then(({ default: log }) => {
    log('you just click the cat!')
  })
  const classes = ['scale-75', 'lg:scale-50']
  if (e.target.classList.contains('scale-75')) {
    e.target.classList.remove(...classes)
  } else {
    e.target.classList.add(...classes)
  }
})
