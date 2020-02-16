document.querySelector('#cover').addEventListener('click', function(e) {
  const classes = ['transform', 'scale-75', 'lg:scale-50']
  if (e.target.classList.contains('transform')) {
    e.target.classList.remove(...classes)
  } else {
    e.target.classList.add(...classes)
  }
})
