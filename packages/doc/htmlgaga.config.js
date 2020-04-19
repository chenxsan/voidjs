const PluginHelmet = require('@htmlgaga/plugin-react-helmet').default
module.exports = {
  html: {
    pretty: false
  },
  plugins: [new PluginHelmet()]
}
