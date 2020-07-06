import path from 'path'
import * as express from 'express'
import chokidar, { WatchOptions } from 'chokidar'
import debounce from 'lodash/debounce'
import sleep from './utils/sleep'
import cleanCache from './utils/cleanCache'
import merge, { Merge } from './utils/merge'

type MockMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

type PathType = string | RegExp | Array<string | RegExp>

const defaultOptions = {
  /** api基础路径 */
  baseUrl: '/',
  /** 服务启用的接口 */
  include: '*' as PathType,
  /** 没有匹配到api接口时，是否把请求交给下一个中间件处理 */
  fallthrough: true,
  /** 文件改动后更新mock服务的延迟时间（ms），用于防抖 */
  updateDelay: 2000,
}

type DefaultOptions = typeof defaultOptions

export type MockOptions = {
  /** 入口文件 */
  main: string
  /** 要排除的接口 */
  exclude?: PathType
  /** 需要监测变化的文件/文件夹，作为第一个参数传递给`chokidar.watch` */
  watchPaths: string | readonly string[]
  /** 作为第二个参数传递给`chokidar.watch` */
  watchOptions?: WatchOptions
  /** 中间件 */
  middlewares?: express.Handler[]
} & Partial<DefaultOptions>

export interface MockResponse {
  /** 响应数据或处理请求的函数 */
  response?: unknown[] | Record<string, unknown> | express.Handler
  /** 响应等候时间(ms) */
  delay?: number
  /** HTTP状态码 */
  status?: number
}

export interface MockRequest {
  [key: string]: MockResponse
}

/** 辅助函数，方便获取类型提示 */
export function mockRequest(request: MockRequest): MockRequest {
  return request
}

export default class MockService {
  router: express.IRouter
  options: Merge<DefaultOptions, MockOptions>

  constructor(public app: express.Application, options: MockOptions) {
    this.router = express.Router()
    this.options = merge(defaultOptions, options)

    this.setupRouter()
    this.setupMiddlewares()
    this.watch()
  }

  setupRouter(): void {
    try {
      const requests = require(this.options.main) as MockRequest
      Object.entries(requests).map(
        ([key, { response, delay, status = 200 }]) => {
          const [_method, url] = key.split(' ')
          const method = _method.toLowerCase() as MockMethod
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

  setupMiddlewares(): void {
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
            require.resolve(main) === require.resolve(pathname) ||
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

  includes(url: string, paths: PathType): boolean {
    Array.isArray(paths) || (paths = [paths])
    return paths.some((path) => {
      if (typeof path === 'string') return path === '*' || path === url
      return path.test(url)
    })
  }
}
