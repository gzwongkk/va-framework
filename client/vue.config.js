module.exports = {
  devServer: {
    host: 'localhost',
  },

  pluginOptions: {
    quasar: {
      importStrategy: 'kebab',
      rtlSupport: true
    }
  },

  transpileDependencies: [
    'quasar'
  ]
};
