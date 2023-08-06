import ConceptDb, { ConceptBase } from "../conceptDb";
import ConceptRouter, { HttpError, Session } from "../conceptRouter";
import { NextFunction, Request, Response } from "express";

interface Freet extends ConceptBase {
  author: string;
  content: string;
}

class FreetValidators {
  static async isOwner(document: Freet, session: Session) {
    if (document.author !== session.user?.username) {
      throw new HttpError(401, "You don't own this freet!");
    }
  }
}

const freetDb = new ConceptDb<Freet>("freet");
const freet = new ConceptRouter<Freet>(freetDb);

freet.defineCreateAction({ 'validate': [FreetValidators.isOwner] });
freet.defineDeleteAction({ 'validate': [FreetValidators.isOwner] });
freet.defineUpdateAction({ 'validate': [FreetValidators.isOwner] });
freet.defineReadAction();

freet.router.get("/", ...freet.handlers("read"));
freet.router.post("/", ...freet.handlers("create"));
freet.router.patch("/", ...freet.handlers("update"));
freet.router.delete("/", ...freet.handlers("delete"));

export default freet;