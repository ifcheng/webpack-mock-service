import path from 'path'
import * as express from 'express'
import chokidar, { WatchOptions } from 'chokidar'
import debounce from 'lodash/debounce'
import sleep from './utils/sleep'
import cleanCache from './utils/cleanCache'
import merge, { Merge } from './utils/merge'
import requireAll from './requireAll'

type MockMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

type APIMatcher = string | RegExp | Array<string | RegExp>

const defaultOptions = {
  /** mock文件夹绝对路径 */
  directory: path.join(process.cwd(), 'mock'),
  /** 是否使用子目录 */
  useSubdirectories: true,
  /** api基础路径 */
  baseUrl: '/',
  /** 服务启用的接口 */
  includeApis: '*' as APIMatcher,
  /** 没有匹配到api接口时，是否把请求交给下一个中间件处理 */
  fallthrough: true,
  /** 文件改动后更新mock服务的延迟时间（ms），用于防抖 */
  updateDelay: 2000,
}

type DefaultOptions = typeof defaultOptions

export type MockOptions = {
  /** 文件过滤器 */
  filter?: RegExp | ((filepath: string) => boolean)
  /** 要排除的接口 */
  excludeApis?: APIMatcher
  /** 需要监测变化的文件/文件夹，作为第一个参数传递给`chokidar.watch` */
  watchPaths?: string | readonly string[]
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
  cacheFiles: string[] = []

  constructor(
    public app: express.Application,
    options: string | MockOptions = {}
  ) {
    if (typeof options === 'string') {
      options = { directory: options }
    }
    this.router = express.Router()
    this.options = merge(defaultOptions, options)

    this.setupRouter()
    this.setupMiddlewares()
    this.watch()
  }

  setupRouter(): void {
    const { directory, useSubdirectories, filter } = this.options
    try {
      const modules = requireAll<MockRequest>(
        directory,
        filter,
        useSubdirectories
      )
      this.cacheFiles = Object.keys(modules)
      const requests = Object.values(modules).reduce(
        (a, b) => ({ ...a, ...b }),
        {}
      )
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
    middlewares && this.app.use(baseUrl, middlewares)
    this.app.use(baseUrl, this.router)
  }

  watch(): void {
    const { directory, watchPaths, watchOptions, updateDelay } = this.options
    chokidar
      .watch(watchPaths || directory, watchOptions)
      .on(
        'change',
        debounce(filepath => {
          cleanCache(filepath)
          if (path.basename(filepath).startsWith('_')) {
            this.cacheFiles.forEach(id => cleanCache(id))
          }
          this.router.stack.length = 0
          this.setupRouter()
        }, updateDelay)
      )
      .on('err', err => console.log(err))
  }

  mock(url: string): boolean {
    const { includeApis, excludeApis } = this.options
    return (
      this.includes(url, includeApis) &&
      (typeof excludeApis === 'undefined' || !this.includes(url, excludeApis))
    )
  }

  includes(url: string, paths: APIMatcher): boolean {
    Array.isArray(paths) || (paths = [paths])
    return paths.some(path => {
      if (typeof path === 'string') return path === '*' || path === url
      return path.test(url)
    })
  }
}
