const path = require('path')
const express = require('express')
const MockService = require('../lib').default

const app = express()
const entry = path.join(__dirname, 'api.js')
new MockService(app, {
  main: entry,
  watchPaths: entry,
})

app.listen(3000)
