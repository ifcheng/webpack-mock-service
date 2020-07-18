const { mockRequest } = require('../../lib')
const products = require('./_data')

module.exports = mockRequest({
  'GET /products': {
    delay: 500,
    response: products,
  },
  'GET /products/:id': {
    response(req, res) {
      const data = products.find(item => item.id === req.params.id)
      data
        ? res.send(data)
        : res.status(404).send({
            message: '产品信息不存在',
          })
    },
  },
})
