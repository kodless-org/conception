import { Request, Response, NextFunction, RequestHandler } from "express";

export function makeRoute(f: Function, isValidator: boolean = false): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const reqMap = (name: string) => {
      if (name === "session" || name == "query") {
        return req[name];
      }
      const ret = req.params[name] || req.query[name] || req.body[name];
      if (ret === undefined || ret === null) {
        console.log(`${name} does not exist in the query`);
      }
      return ret;
    }

    const args = f.toString().match(/\((.*?)\)/)![1].split(",") // Simple regex to get "name: type" items in signature
                  .map((param: string) => param.split("=")[0].trim()) // remove default values and whitespaces
                  .map(reqMap);

    
    let result;
    try {
      result = f.apply(null, args);
      if (result instanceof Promise) {
        result = await result;
      }
    } catch (e: any) {
      res.status(e?.code ?? 500).json({msg: e?.message ?? "Internal Server Error"});
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