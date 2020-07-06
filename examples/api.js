const { mockRequest } = require('../lib')

const products = [
  {
    id: '0',
    name: '华为P40',
    price: '4099',
  },
  {
    id: '1',
    name: '华为P40 Pro',
    price: '5699',
  },
]

module.exports = mockRequest({
  'GET /products': {
    delay: 500,
    response: products,
  },
  'GET /products/:id': {
    response(req, res) {
      const data = products.find((item) => item.id === req.params.id)
      data
        ? res.send(data)
        : res.status(404).send({
            message: '产品信息不存在',
          })
    },
  },
})
