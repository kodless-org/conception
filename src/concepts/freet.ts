import { Filter, ObjectId } from "mongodb";
import ConceptDb, { ConceptBase } from "../conceptDb";
import ConceptRouter, { ActionOptions } from "../conceptRouter";
import { NextFunction, Request, Response } from "express";
import { Validators } from "../utils";

interface Freet extends ConceptBase {
  author: string;
  content: string;
}

class FreetDb extends ConceptDb<Freet> {
  async getAuthorFreets(name: string): Promise<Freet[]> {
    return await this.readMany({author: name});
  }
}

class FreetValidators {
  static async isOwner(req: Request, res: Response, next: NextFunction) {
    const freet = req.body.document as Freet;
    if (freet.author !== req.session.user?.username) {
      
    }
  }
}

const freet = new ConceptRouter<Freet, FreetDb>(new FreetDb("freet"));

freet.defineCreateAction({'validate': [Validators.loggedOut]});
// freet.defineDeleteAction({'validate': []});

export default freet;