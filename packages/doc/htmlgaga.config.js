const PluginHelmet = require('@htmlgaga/plugin-react-helmet').default
module.exports = {
  html: {
    pretty: true
  },
  plugins: [new PluginHelmet()]
}
