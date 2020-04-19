export type Merged<T, U> = T & Omit<U, keyof T>

export default function merge<T extends object, U extends object>(
  first: T,
  second: U
): Merged<T, U> {
  const result: any = {}
  Object.keys(first).forEach((key) => (result[key] = (first as any)[key]))
  Object.keys(second).forEach((key) => {
    if ((second as any)[key] !== void 0) {
      result[key] = (second as any)[key]
    }
  })
  return result as Merged<T, U>
}
