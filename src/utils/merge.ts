export type Merge<T, U> = T & Omit<U, keyof T>

export default function merge<T extends object, U extends object>(
  first: T,
  second: U
): Merge<T, U> {
  const result: any = {}
  Object.keys(first).forEach((key) => (result[key] = (first as any)[key]))
  Object.keys(second).forEach((key) => {
    if (!result.hasOwnProperty(key) || (second as any)[key] !== void 0) {
      result[key] = (second as any)[key]
    }
  })
  return result as Merge<T, U>
}
