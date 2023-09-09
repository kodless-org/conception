import { Filter, ObjectId } from "mongodb";

import Concept from "../framework/concept";
import DocCollection, { BaseDoc, WithoutBase } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface Freet extends BaseDoc {
  author: ObjectId;
  content: string;
  backgroundColor?: string;
}

export type PureFreet = WithoutBase<Freet>;

class FreetConcept extends Concept<{ freets: Freet }> {
  async create(freet: PureFreet) {
    const _id = (await this.db.freets.createOne(freet)).insertedId;
    return { msg: "Freet successfully created!", freet: { ...freet, _id } };
  }

  async read(query: Filter<Freet>) {
    const freets = await this.db.freets.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return { freets };
  }

  async update(_id: ObjectId, update: Partial<PureFreet>) {
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

const freetManager = new FreetConcept({ freets: new DocCollection<Freet>("freets") });

export default freetManager;
