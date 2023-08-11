import express, { RequestHandler } from "express";

import Concept, { Action } from "./concept";
import ConceptDb, { type ConceptBase } from "./conceptDb";
import { makeRoute, makeValidator } from "./utils";

type HttpMethod = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

export class ConceptRouter<Schema extends ConceptBase, Db extends ConceptDb<Schema> = ConceptDb<Schema>> {
  public readonly router = express.Router();
  constructor(private readonly concept: Concept<Schema, Db>) { }

  get name() {
    return this.concept.name;
  }

  private handlers(action: Action): RequestHandler[] {
    return [...action.validators.map(makeValidator), makeRoute(action.action)];
  }

  private route(method: HttpMethod, path: string, name: string) {
    const action = this.concept.action(name);
    this.router[method](path, this.handlers(action));
  }

  public all(path: string, name: string) { this.route('all', path, name) }
  public get(path: string, name: string) { this.route('get', path, name) }
  public post(path: string, name: string) { this.route('post', path, name) }
  public put(path: string, name: string) { this.route('put', path, name) }
  public delete(path: string, name: string) { this.route('delete', path, name) }
  public patch(path: string, name: string) { this.route('patch', path, name) }
  public options(path: string, name: string) { this.route('options', path, name) }
  public head(path: string, name: string) { this.route('head', path, name) }
}