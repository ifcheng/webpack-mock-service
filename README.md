# webpack-mock-service

提供api mock服务，可配合`webpack-dev-server`使用，也可单独使用

## 安装

```
npm install webpack-mock-service
```

## 使用

**webpack.config.js**

```js
const path = require('path')
const MockService = require('webpack-mock-service').default
const routesPath = path.join(process.cwd(), 'mock/routes.js')

module.exports = {
  // ...
  devServer: {
    // ...
    before(app) {
      new MockService(app, {
        main: routesPath,
        watchPaths: routesPath,
        exclude: '/exclude',
        baseUrl: '/api'
      })
    },
    // '/api/exclude'和'/api/nomatch'将会被转发到'http://api.example'
    proxy: {
      '/api': {
        target: 'http://api.example',
        changeOrigin: true
      }
    }
  }
}
```

**routes.js**

```js
module.exports = [
  {
    url: '/test',
    response: {
      message: 'Response from mock service.'
    },
    // 1s后响应
    delay: 1000
  },
  {
    method: 'post',
    url: '/exclude',
    response(req, res) {
      res.send('whatever you want')
    }
  }
]
```

## 参数说明

**MockService Options**

Param          | Type                            | Default     | Description 
-------------- | ------------------------------- | ----------- | ------------ 
`main`         | `string`                        | `undefined` | 路由入口文件，建议使用绝对路径 
`watchPaths`   | `string \| string[]`            | `undefined` | 需要监测变化的文件/文件夹，作为第一个参数传递给`chokidar.watch()` 
`watchOptions` | `object`                        | `undefined` | 作为第二个参数传递给`chokidar.watch()` 
`middlewares`  | `array`                         | `undefined` | 中间件 
`baseUrl`      | `string`                        | `/`         | api基础路径 
`include`      | `string \| RegExp \| (string \| RegExp)[]` | `*`          | 包含的api接口 
`exclude`      | `string \| RegExp \| (string \| RegExp)[]` | `undefined`  | 排除的api接口 
`fallthrough`  | `boolean`                       | `true`      | 没有匹配到api接口时，是否把请求交给下一个中间件处理
`updateDelay`  | `number`                        | `2000`      | 文件改动后更新mock服务的延迟时间(ms)，用于防抖。此外，很多编辑器在保存的时侯是先把原文件清空，再进行保存，因此会触发2次文件改变事件，设置该值也可以解决这个问题

**路由文件**

Key            | Description 
-------------- | ------------------------------- 
`method`       | 请求方法，默认为`get`
`url`          | 请求地址
`response`     | 响应数据或处理请求的函数
`delay`        | 响应等候时间(ms)

## 热更新

默认情况下，监测到文件变化时只会清除路由入口文件和改动文件本身的缓存。当这个文件不会影响到其他路由文件的输出时，这么做是没问题的。否则，务必使文件名以`_`开头，这样会自路由入口模块递归地清除所有子模块的缓存，确保拿到最新数据。
