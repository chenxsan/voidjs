/**
 * we write client side javascript here
 * you can write typescript too
 */
import log from './log'
document.querySelector('#cover').addEventListener('click', function(e) {
  log('you just click the cat!')
  const classes = ['transform', 'scale-75', 'lg:scale-50']
  if (e.target.classList.contains('transform')) {
    e.target.classList.remove(...classes)
  } else {
    e.target.classList.add(...classes)
  }
})
