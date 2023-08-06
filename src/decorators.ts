import { Request, RequestHandler, Response } from "express";

export function makeRoute(f: Function): RequestHandler {
  return (req: Request, res: Response) => {
    const paramNames = f.toString().match(/\((.*?)\)/)![1].split(",").map((param: string) => param.split("=")[0].trim());
    const args = paramNames.map(name => name !== "session" ? req.params[name] || req.query[name] || req.body[name] : req.session);
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