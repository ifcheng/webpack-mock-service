/* eslint-disable */

const path = require('path')

module.exports = {
  // ...
  devServer: {
    // ...
    before(app) {
      new MockService(app, {
        main: path.join(process.cwd(), 'mock/index.js'),
        watchPaths: path.join(process.cwd(), 'mock/routes'),
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
