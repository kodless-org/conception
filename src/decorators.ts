import { Request, RequestHandler, Response } from "express";

export function makeRoute(f: Function): RequestHandler {
  return (req: Request, res: Response) => {
    const reqMap = (name: string) => {
      if (name === "session" || name == "query") {
        return req[name];
      }
      const ret = req.params[name] || req.query[name] || req.body[name];
      if (ret === undefined || ret === null) {
        console.log(`${ret} does not exist in the query`);
      }
      return ret;
    }

    const args = f.toString().match(/\((.*?)\)/)![1].split(",") // Simple regex to get "name: type" items in signature
                  .map((param: string) => param.split("=")[0].trim()) // remove default values and whitespaces
                  .map(reqMap);
    const result = f.apply(null, args);
    if (result instanceof Promise) {
      result.then(result => res.json(result)).catch(err => {
        console.log(err);
        res.status(500).json({ msg: "Internal Server Error" });
      });
    } else {
      res.json(result);
    }
  }
}