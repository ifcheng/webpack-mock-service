const path = require('path')
const express = require('express')
const MockService = require('../lib').default

const app = express()
new MockService(app, {
  directory: path.join(__dirname, 'mock'),
  filter(filepath) {
    return !path.basename(filepath).startsWith('_')
  },
})

app.listen(3000)
