/**
 * 清除指定模块的缓存
 * @param path 需要清除缓存的模块路径
 * @param deep 是否递归清除所有子模块的缓存
 */
export default function cleanCache(path: string, deep = false): void {
  const module = require.cache[require.resolve(path)]
  if (!module) return
  if (deep) {
    const ids = module.children.map((child) => child.id)
    ids.forEach((id) => cleanCache(id, true))
  }
  if (module.parent) {
    module.parent.children.splice(module.parent.children.indexOf(module), 1)
  }
  delete require.cache[require.resolve(path)]
}
