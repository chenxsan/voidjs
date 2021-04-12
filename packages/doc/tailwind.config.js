module.exports = {
  mode: 'jit',
  purge: {
    content: [
      './pages/**/*.js',
      './pages/**/*.mdx',
      './components/**/*.js',
      './components/**/*.tsx',
      './public/js/**/*.js',
    ],
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
