import express from "express";
import {Request, Response, NextFunction} from "express";

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export default class WebConcept<Params> {
  public readonly router = express.Router();

  constructor(public readonly name: string) {}

  public create(middlewares: ExpressMiddleware[]) {
    this.router.post("/", middlewares, async (req: Request, res: Response) => {
      // something
    });
  }

  public read(middlewares: ExpressMiddleware[]) {
    this.router.get("/", middlewares, async (req: Request, res: Response) => {
      res.json({ msg: "Hi!" });
    });
  }

  public update(middlewares: ExpressMiddleware[]) {
    this.router.get("/", middlewares, async (req: Request, res: Response) => {
      // something
    });
  }

  public delete(middlewares: ExpressMiddleware[]) {
    this.router.get("/", middlewares, async (req: Request, res: Response) => {
      // something
    });
  }
}

/*
{
  id: ,
  ...
}
*/