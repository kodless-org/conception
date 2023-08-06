import { Filter, ObjectId } from "mongodb";
import ConceptDb, { ConceptBase } from "../conceptDb";
import ConceptRouter, { ActionOptions } from "../conceptRouter";
import { NextFunction, Request, Response } from "express";
import { Validators } from "../utils";

interface Freet extends ConceptBase {
  author: string;
  content: string;
}

class FreetValidators {
  static async isOwner(req: Request, res: Response, next: NextFunction) {
    const freet = req.body.document as Freet;
    if (freet.author !== req.session.user?.username) {
      res.status(401).json({msg: "You don't own this freet!"});
      return;
    }
    next();
  }
}

const freetDb = new ConceptDb<Freet>("freet");
const freet = new ConceptRouter<Freet>(freetDb);

freet.defineCreateAction({'validate': [FreetValidators.isOwner]});
freet.defineDeleteAction({'validate': [FreetValidators.isOwner]});
freet.defineUpdateAction({'validate': [FreetValidators.isOwner]});
freet.defineReadAction();

freet.router.get("/", ...freet.handlers("read"));
freet.router.post("/", ...freet.handlers("create"));
freet.router.patch("/", ...freet.handlers("update"));
freet.router.delete("/", ...freet.handlers("delete"));

export default freet;