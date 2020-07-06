/* eslint-disable */

const path = require('path')
const MockService = require('webpack-mock-service').default

module.exports = {
  // ...
  devServer: {
    // ...
    before(app) {
      new MockService(app, {
        main: path.join(process.cwd(), 'mock/index.js'),
        watchPaths: path.join(process.cwd(), 'mock'),
        exclude: '/api/exclude'
      })
    },
    // '/api/exclude'将会被转发到'http://api.example'
    proxy: {
      '/api': {
        target: 'http://api.example',
        changeOrigin: true
      }
    }
  }
}
