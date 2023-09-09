import DocCollection, { BaseDoc } from "./doc";

export default class Concept<T extends Record<string, BaseDoc>> {
  constructor(public readonly db: { [K in keyof T]: DocCollection<T[K]> }) {}
}
