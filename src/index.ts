import path from 'path'
import * as express from 'express'
import chokidar, { WatchOptions } from 'chokidar'
import debounce from 'lodash/debounce'
import sleep from './utils/sleep'
import cleanCache from './utils/cleanCache'
import merge, { Merge } from './utils/merge'

type IncludeType = string | RegExp | Array<string | RegExp>

type MockMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

const defaultOptions = {
  // api基础路径
  baseUrl: '/',
  include: '*' as IncludeType,
  // 没有匹配到api接口时，是否把请求交给下一个中间件处理
  fallthrough: true,
  // 文件改动后更新mock服务的延迟时间（ms），用于防抖
  updateDelay: 2000,
}

type DefaultOptions = typeof defaultOptions

export type MockOptions = {
  // 路由入口文件
  main: string
  exclude?: IncludeType
  // 需要监测变化的文件/文件夹，作为第一个参数传递给chokidar.watch()
  watchPaths: string | readonly string[]
  // 作为第二个参数传递给chokidar.watch()
  watchOptions?: WatchOptions
  // 中间件
  middlewares?: express.Handler[]
} & Partial<DefaultOptions>

export interface MockRoute {
  method?: MockMethod
  url: string
  response?: string | object | express.Handler
  delay?: number
  status?: number
}

export type MockRequest = Record<string, Omit<MockRoute, 'method' | 'url'>>

class MockService {
  router: express.IRouter
  options: Merge<DefaultOptions, MockOptions>

  constructor(public app: express.Application, options: MockOptions) {
    this.router = express.Router()
    this.options = merge(defaultOptions, options)

    this.setupRouter()
    this.setupMiddleware()
    this.watch()
  }

  setupRouter(): void {
    try {
      let routes = require(this.options.main) as MockRoute[] | MockRequest
      if (!Array.isArray(routes)) {
        routes = Object.entries(routes).map(([key, val]) => {
          const route = { ...val } as MockRoute
          const [method, url] = key.split(' ')
          route.method = method as MockMethod
          route.url = url
          return route
        })
      }
      routes.forEach(
        ({ method = 'get', url, response, delay, status = 200 }) => {
          method = method.toLowerCase() as MockMethod
          this.router[method](url, async (req, res, next) => {
            if (!this.mock(url)) return next('router')
            if (delay) await sleep(delay)
            typeof response === 'function'
              ? response(req, res, next)
              : res.status(status).send(response)
          })
        }
      )
      this.router.use((req, res, next) => {
        this.options.fallthrough ? next('router') : res.status(404).end()
      })
    } catch (err) {
      console.log(err)
    }
  }

  setupMiddleware(): void {
    const { middlewares, baseUrl } = this.options
    middlewares && this.app.use(middlewares)
    this.app.use(baseUrl, this.router)
  }

  watch(): void {
    const { watchPaths, watchOptions, main, updateDelay } = this.options
    chokidar
      .watch(watchPaths, watchOptions)
      .on(
        'change',
        debounce((pathname) => {
          this.router.stack.length = 0
          if (path.basename(pathname).startsWith('_')) {
            cleanCache(main, true)
          } else {
            cleanCache(main)
            cleanCache(pathname)
          }
          this.setupRouter()
        }, updateDelay)
      )
      .on('err', (err) => console.log(err))
  }

  mock(url: string): boolean {
    const { include, exclude } = this.options
    return (
      this.includes(url, include) &&
      (typeof exclude === 'undefined' || !this.includes(url, exclude))
    )
  }

  includes(url: string, paths: IncludeType): boolean {
    Array.isArray(paths) || (paths = [paths])
    return paths.some((path) => {
      if (typeof path === 'string') return path === '*' || path === url
      return path.test(url)
    })
  }
}

export default MockService
