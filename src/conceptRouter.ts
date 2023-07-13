import express from "express";
import {Request, Response, NextFunction} from "express";
import { OptionalUnlessRequiredId, Document, ObjectId, Filter } from "mongodb";
import ConceptDb from "./conceptDb";

export type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;

/**
 * ConceptRouter defines base routes for a concept based on CRRUDS (read car-rads) model:
 * - Create: make a new document
 * - Read: read one document based on its identifier
 * - Replace: replace one document based on its identifier
 * - Update: update one document based on its identifier
 * - Delete: delete one document based on its identifier
 * - Search: search for documents given a filter
 * 
 * 
 * 
 * If you want to add more functionality to it, extend this class and define similar rules!
 */
export default class ConceptRouter<Schema extends Document> {

  public readonly router = express.Router();
  protected readonly db;

  constructor(public readonly name: string) {
    this.db = new ConceptDb<Schema>(name);
  }

  /**
   * Creates one Freet object from `req.body.document` and responds with the created document
   * with its _id field in `document`.
   * 
   * @param happensBefore middlewares that will run before
   * @param happensAfter middlewares that will run after
   */
  public create(happensBefore: ExpressMiddleware[] = [], happensAfter: ExpressMiddleware[] = []) {
    this.router.post("/", happensBefore, async (req: Request, res: Response, next: NextFunction) => {
      const item = req.body.document as OptionalUnlessRequiredId<Schema>;
      console.log(item);
      const _id = (await this.db.createOne(item)).insertedId;
      res.json({ document: {_id, ...item} });
      next();
    }, happensAfter);
  }

  /**
   * Gets a freet by id and reponds it in `document`.
   * 
   * @param happensBefore middlewares that will run before
   * @param happensAfter middlewares that will run after
   */
  public read(happensBefore: ExpressMiddleware[] = [], happensAfter: ExpressMiddleware[] = []) {
    this.router.get("/:id", happensBefore, async (req: Request, res: Response, next: NextFunction) => {
      const item = await this.db.readOne({_id: new ObjectId(req.params.id)} as Filter<Schema>);
      res.json({ document: item });
      next();
    }, happensAfter);
  }

  // public update(happensBefore: ExpressMiddleware[]) {
  //   this.router.get("/:id", happensBefore, async (req: Request, res: Response) => {
  //     // something
  //   });
  // }

  // public delete(happensBefore: ExpressMiddleware[]) {
  //   this.router.get("/:id", happensBefore, async (req: Request, res: Response) => {
  //     // something
  //   });
  // }

  // public search()
}

/*
{
  id: ,
  ...
}
*/