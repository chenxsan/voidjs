const PluginHelmet = require('@void-js/plugin-react-helmet').default
module.exports = {
  html: {
    pretty: true
  },
  plugins: [new PluginHelmet()]
}
