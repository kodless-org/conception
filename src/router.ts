import express, { Request, Response } from "express";

import Concept, { HttpError } from "./concept";
import { getParamNames } from "./utils";

type HttpMethod = "all" | "get" | "post" | "put" | "delete" | "patch" | "options" | "head";

export class Router {
  public readonly router = express.Router();
  constructor(
    public readonly name: string,
    private readonly ctx: Concept<any> | null = null, // eslint-disable-line
  ) {}

  private route(method: HttpMethod, path: string, action: Function) {
    this.router[method](path, this.makeRoute(action));
  }

  public all(path: string, action: Function) {
    this.route("all", path, action);
  }
  public get(path: string, action: Function) {
    this.route("get", path, action);
  }
  public post(path: string, action: Function) {
    this.route("post", path, action);
  }
  public put(path: string, action: Function) {
    this.route("put", path, action);
  }
  public delete(path: string, action: Function) {
    this.route("delete", path, action);
  }
  public patch(path: string, action: Function) {
    this.route("patch", path, action);
  }
  public options(path: string, action: Function) {
    this.route("options", path, action);
  }
  public head(path: string, action: Function) {
    this.route("head", path, action);
  }

  private makeRoute(f: Function) {
    return async (req: Request, res: Response) => {
      const reqMap = (name: string) => {
        if (name === "session" || name == "param" || name == "query" || name == "body") {
          return req[name];
        }
        const ret = req.params[name] || req.query[name] || req.body[name];
        if (ret === undefined || ret === null) {
          // TODO: Can we know if this param was required?
          return undefined;
        }
        return ret;
      };

      const argNames = getParamNames(f);
      const args = argNames.map(reqMap);

      let result;
      try {
        result = f.call(this.ctx, ...args);
        if (result instanceof Promise) {
          result = await result;
        }
      } catch (e: unknown) {
        const error = e as HttpError;
        // TODO: this is a pretty bad error to send back
        res.status(error?.code ?? 500).json({ msg: error?.message ?? "Internal Server Error" });
        return;
      }
      res.json(result);
    };
  }
}
