import fs from 'fs'
import path from 'path'

function requireAll<T = any>(
  directory: string,
  filter: RegExp | ((filepath: string) => boolean) = /\.js(on)?$/,
  useSubdirectories = true
): Record<string, T> {
  const _filter =
    typeof filter === 'function'
      ? filter
      : (filepath: string): boolean => filter.test(filepath)
  const modules: Record<string, T> = {}

  const files = fs.readdirSync(directory)
  files.forEach(file => {
    const filepath = path.resolve(directory, file)
    if (fs.statSync(filepath).isDirectory()) {
      useSubdirectories &&
        Object.assign(modules, requireAll<T>(filepath, filter, true))
    } else if (_filter(filepath)) {
      modules[filepath] = require(filepath)
    }
  })
  return modules
}

export default requireAll
