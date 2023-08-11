import { Request, Response, NextFunction, RequestHandler } from "express";
import { HttpError, Session } from "./concept";

export class Validators {
  static loggedOut(session: Session) {
    if (session.user) {
      throw new HttpError(401, "You need to be logged out!");
    }
  }

  static loggedIn(session: Session) {
    if (!session.user) {
      throw new HttpError(401, "You need to be logged in!");
    }
  }
}

export function getParamNames(f: Function) {
  return f.toString().match(/\((.*?)\)/)![1].split(",") // Simple regex to get "name: type" items in signature
  .map((param: string) => param.split("=")[0].trim()); // remove default values and whitespaces
}

export function makeRoute(f: Function, isValidator: boolean = false): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const reqMap = (name: string) => {
      if (name === "session" || name == "param" || name == "query" || name == "body") {
        return req[name];
      }
      const ret = req.params[name] || req.query[name] || req.body[name];
      if (ret === undefined || ret === null) {
        // TODO: Detect if `name` was required or not by looking at function params.
        console.warn(`${name} is missing from the request`);
      }
      return ret;
    }

    const args = getParamNames(f).map(reqMap);

    let result;
    try {
      result = f.apply(null, args);
      if (result instanceof Promise) {
        result = await result;
      }
    } catch (e: any) {
      res.status(e?.code ?? 500).json({ msg: e?.message ?? "Internal Server Error" });
      return;
    }

    if (isValidator) {
      next(); // do not send result, go to the next step
    } else {
      res.json(result);
    }
  }
}

export function makeValidator(f: Function): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    makeRoute(f, true)(req, res, next);
  };
}
