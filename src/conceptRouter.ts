import express from "express";

import { makeRoute } from "./utils";

type HttpMethod = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

export class ConceptRouter {
  public readonly router = express.Router();
  constructor(public readonly name: string) {}

  private route(method: HttpMethod, path: string, action: Function) {
    this.router[method](path, makeRoute(action));
  }

  public all(path: string, action: Function) { this.route('all', path, action) }
  public get(path: string, action: Function) { this.route('get', path, action) }
  public post(path: string, action: Function) { this.route('post', path, action) }
  public put(path: string, action: Function) { this.route('put', path, action) }
  public delete(path: string, action: Function) { this.route('delete', path, action) }
  public patch(path: string, action: Function) { this.route('patch', path, action) }
  public options(path: string, action: Function) { this.route('options', path, action) }
  public head(path: string, action: Function) { this.route('head', path, action) }
}