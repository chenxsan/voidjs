module.exports = {
  purge: {
    content: ['./pages/**/*.js', './components/**/*.js', './public/js/**/*.js'],
  },
  theme: {
    screens: {
      sm: '768px',
      lg: '1200px',
    },
    extend: {},
  },
  variants: {},
  plugins: [],
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
}
