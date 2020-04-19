import path from 'path'
import * as express from 'express'
import chokidar, { WatchOptions } from 'chokidar'
import sleep from './utils/sleep'
import cleanCache from './utils/cleanCache'
import merge, { Merged } from './utils/merge'

type IncludeType = string | RegExp | Array<string | RegExp>

type MockMethod = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch'

const defaultOptions = {
  baseUrl: '/',
  include: '*' as IncludeType,
  fallthrough: true,
}

type DefaultOptions = typeof defaultOptions

export type MockOptions = {
  main: string
  exclude?: IncludeType
  watchPaths: string | readonly string[]
  watchOptions?: WatchOptions
} & Partial<DefaultOptions>

export interface MockRoute {
  method?: MockMethod
  url: string
  response: any
  delay?: number
}

class MockService {
  router: express.IRouter
  options: Merged<DefaultOptions, MockOptions>
  indexRoute: string

  constructor(public app: express.Application, options: MockOptions) {
    this.router = express.Router()
    this.options = merge(defaultOptions, options)
    this.indexRoute = path.resolve(process.cwd(), this.options.main)

    this.setupRouter()
    this.setupMiddleware()
    this.watch()
  }

  setupRouter(): void {
    const routes = require(this.indexRoute) as MockRoute[]
    routes.forEach(({ method = 'get', url, response, delay }) => {
      this.router[method](url, async (req, res, next) => {
        if (!this.mock(url)) return next('router')
        if (delay) await sleep(delay)
        typeof response === 'function'
          ? response(req, res, next)
          : res.send(response)
      })
    })
    this.router.use((req, res, next) => {
      this.options.fallthrough ? next('router') : res.sendStatus(404)
    })
  }

  setupMiddleware(): void {
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(this.options.baseUrl, this.router)
  }

  watch(): void {
    const { watchPaths, watchOptions } = this.options
    chokidar
      .watch(watchPaths, watchOptions)
      .on('change', (pathname) => {
        this.router.stack.length = 0
        if (path.basename(pathname).startsWith('_')) {
          cleanCache(this.indexRoute, true)
        } else {
          cleanCache(this.indexRoute)
          cleanCache(pathname)
        }
        this.setupRouter()
      })
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
