const path = require('path')
const express = require('express')
const MockService = require('../lib').default

const app = express()
const indexRoutes = path.join(process.cwd(), 'examples/routes.js')
new MockService(app, {
  main: indexRoutes,
  watchPaths: indexRoutes,
})

app.listen(3000)
