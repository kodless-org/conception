import { Filter, ObjectId } from "mongodb";
import ConceptDb, { ConceptBase } from "../conceptDb";
import ConceptRouter, { ActionOptions } from "../conceptRouter";
import { NextFunction, Request, Response } from "express";

interface Freet extends ConceptBase {
  author: string;
  content: string;
}

class FreetDb extends ConceptDb<Freet> {
  // example for convenience:
  async getAuthorFreets(name: string): Promise<Freet[]> {
    return this.readMany({author: name});
  }

  // more complex example (notice how we can easily use this.existingMethod without touching MongoDb!):
  /**
   * Duplicates item with given id.
   * 
   * @param id `_id` of the item to be duplicated
   * @returns `null` if there was no such item or duplicated item's `_id`
   */
  async duplicateOne(id: ObjectId): Promise<ObjectId | null> {
    const item = await this.readOne({_id: id});
    if (item === null) {
      return null;
    }
    const {_id: _, ...copyItem} = item;
    return (await this.createOne(copyItem)).insertedId;
  }
}

class FreetRouter extends ConceptRouter<Freet, FreetDb> {
  public defineSomeAction(options?: ActionOptions) {
    this.db.duplicateOne;
  }
}

const freet = new ConceptRouter<Freet, FreetDb>(new FreetDb("freet"));

export default freet;