const PluginHelmet = require('@voidjs/plugin-react-helmet').default
module.exports = {
  html: {
    pretty: true
  },
  plugins: [new PluginHelmet()]
}
