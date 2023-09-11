import { Filter, ObjectId } from "mongodb";

import Concept from "../framework/concept";
import { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FreetOptions {
  backgroundColor?: string;
}

export interface FreetDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  options?: FreetOptions;
}

export default class FreetConcept extends Concept<{ freets: FreetDoc }> {
  async create(author: ObjectId, content: string, options?: FreetOptions) {
    const _id = (await this.db.freets.createOne({ author, content, options })).insertedId;
    return { msg: "Freet successfully created!", freet: await this.db.freets.readOneById(_id) };
  }

  async read(query: Filter<FreetDoc>) {
    const freets = await this.db.freets.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return { freets };
  }

  async update(_id: ObjectId, update: Partial<FreetDoc>) {
    await this.db.freets.updateOneById(_id, update);
    return { msg: "Freet successfully updated!", freet: await this.db.freets.readOneById(_id) };
  }

  async delete(_id: ObjectId) {
    const freet = await this.db.freets.popOneById(_id);
    return { msg: "Freet deleted successfully!", freet };
  }

  async isAuthorMatch(author: ObjectId, _id: ObjectId) {
    const freet = await this.db.freets.readOneById(_id);
    if (!freet) {
      throw new NotFoundError(`Freet with _id ${_id} does not exist!`);
    }
    if (freet.author !== author) {
      throw new NotAllowedError(`${author} is not the author of freet with _id ${_id}`);
    }
  }
}
