export type Merge<T, U> = T & Omit<U, keyof T>

export default function merge<
  T extends Record<string, unknown>,
  U extends Record<string, unknown>
>(first: T, second: U): Merge<T, U> {
  const result: any = {}
  Object.keys(first).forEach(key => (result[key] = first[key]))
  Object.keys(second).forEach(key => {
    if (!result.hasOwnProperty(key) || second[key] !== void 0) {
      result[key] = second[key]
    }
  })
  return result
}
