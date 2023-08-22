import { SessionData } from "express-session";

import ConceptDb, { ConceptBase } from "./conceptDb";

export type Session = Partial<SessionData>;

export class HttpError extends Error {
  constructor(public readonly code: number, public readonly message: string) {
    super(message);
    this.code = code;
  }
}

export default class Concept<T extends Record<string, ConceptBase>> {
  constructor(public readonly db: { [K in keyof T]: ConceptDb<T[K]> }) {}
}
