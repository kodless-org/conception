import ConceptDb, { CollectionBase } from "./conceptDb";

export default class Concept<T extends Record<string, CollectionBase>> {
  constructor(public readonly db: { [K in keyof T]: ConceptDb<T[K]> }) {}
}
