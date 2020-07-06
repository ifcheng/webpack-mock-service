import { mockRequest } from '../lib'

interface Product {
  id: string
  name: string
  price: string
}

const products: Product[] = [
  {
    id: '0',
    name: '华为P40',
    price: '4299',
  },
  {
    id: '1',
    name: '华为P40 Pro',
    price: '5899',
  },
]

export default mockRequest({
  'GET /products': {
    delay: 500,
    response: products,
  },
  'GET /products/:id': {
    response(req, res): void {
      const data = products.find((item) => item.id === req.params.id)
      data
        ? res.send(data)
        : res.status(404).send({
            message: '产品信息不存在',
          })
    },
  },
})
