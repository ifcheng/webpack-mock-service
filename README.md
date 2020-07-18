# webpack-mock-service

提供api mock服务，可配合`webpack-dev-server`使用，也可单独使用

**V3版本开始不再需要提供入口文件，程序会自动导入mock文件夹下符合条件的文件**

## 安装

```
$ npm install webpack-mock-service
```

## 使用

**webpack.config.js**

```js
const path = require('path')
const MockService = require('webpack-mock-service').default

module.exports = {
  // ...
  devServer: {
    // ...
    before(app) {
      new MockService(app, {
        directory: path.join(process.cwd(), 'mock'), // default
        excludeApis: '/exclude',
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

**mock/index.js**

```js
module.exports = {
  'GET /test': {
    delay: 1000,
    response: {
      message: 'Response from mock service.'
    },
  },
  'POST /exclude': {
    response(req, res) {
      res.send('Response from mock service.')
    },
  },
}
```

## 参数说明

**MockOptions**

Param          | Type                            | Default     | Description 
-------------- | ------------------------------- | ----------- | ------------ 
`directory`    | `string`                        | `path.join(process.cwd(), 'mock')`        | mock文件夹绝对路径 
`useSubdirectories`    | `boolean`               | `true`      | 是否使用子目录 
`filter`       | `RegExp\|((filepath: string) => boolean)`   | `/\.js(on)?$/`      | 文件过滤器 
`watchPaths`   | `string\|string[]`              | `-`         | 需要监测变化的文件/文件夹，作为第一个参数传递给`chokidar.watch` ，默认为`directory`的值
`watchOptions` | `object`                        | `-`         | 作为第二个参数传递给`chokidar.watch` 
`middlewares`  | `express.Handler[]`             | `-`         | 中间件 
`baseUrl`      | `string`                        | `/`         | api基础路径 
`includeApis`      | `string\|RegExp\|Array<string\|RegExp>` | `*` | 包含的api接口 
`excludeApis`      | `string\|RegExp\|Array<string\|RegExp>` | `-` | 排除的api接口 
`fallthrough`  | `boolean`                       | `true`      | 没有匹配到api接口时，是否把请求交给下一个中间件处理
`updateDelay`  | `number`                        | `2000`      | 文件改动后更新mock服务的延迟时间(ms)，用于防抖。此外，很多编辑器在保存的时侯是先把原文件清空，再进行保存，因此会触发2次文件改变事件，设置该值也可以解决这个问题

**MockResponse**

Key           | Type                                                 | Default | Description 
--------------| ---------------------------------------------------  | ------  | ------------------------------- 
`response`    | `unknown[]\|Record<string, unknown>\|express.Handler`| `-`     | 响应数据或处理请求的函数
`delay`       | `number`                                             | `-`     | 响应等候时间(ms)
`status`      | `number`                                             | `200`   | HTTP状态码

## 热更新

默认情况下，监测到文件变化时只会清除改动文件本身的缓存。当这个文件不会影响到其他mock文件的输出时，这么做是没问题的。否则，务必使文件名以`_`开头，这样会清除所有已加载的mock文件的缓存，确保拿到最新数据。
