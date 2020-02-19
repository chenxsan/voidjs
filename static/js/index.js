/**
 * we write client side javascript here
 * you can write typescript too
 */
document.querySelector('#cover').addEventListener('click', function(e) {
  import('./log').then(({ default: log }) => {
    log('you just click the cat!')
  })
  const classes = ['transform', 'scale-75', 'lg:scale-50']
  if (e.target.classList.contains('transform')) {
    e.target.classList.remove(...classes)
  } else {
    e.target.classList.add(...classes)
  }
})
