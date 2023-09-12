import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FreetOptions {
  backgroundColor?: string;
}

export interface FreetDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  options?: FreetOptions;
}

export default class FreetConcept {
  public readonly freets = new DocCollection<FreetDoc>("freets");

  async create(author: ObjectId, content: string, options?: FreetOptions) {
    const _id = (await this.freets.createOne({ author, content, options })).insertedId;
    return { msg: "Freet successfully created!", freet: await this.freets.readOne({ _id }) };
  }

  async read(query: Filter<FreetDoc>) {
    const freets = await this.freets.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return { freets };
  }

  async update(_id: ObjectId, update: Partial<FreetDoc>) {
    await this.freets.updateOne({ _id }, update);
    return { msg: "Freet successfully updated!", freet: await this.freets.readOne({ _id }) };
  }

  async delete(_id: ObjectId) {
    const freet = await this.freets.popOne({ _id });
    return { msg: "Freet deleted successfully!", freet };
  }

  async isAuthorMatch(user: ObjectId, _id: ObjectId) {
    const freet = await this.freets.readOne({ _id });
    if (!freet) {
      throw new FreetNotFoundError(_id);
    }
    if (freet.author.toString() !== user.toString()) {
      throw new FreetAuthorNotMatchError(user, _id);
    }
  }
}

export class FreetNotFoundError extends NotFoundError {
  constructor(public readonly _id: ObjectId) {
    super("Freet {0} does not exist!", _id);
  }
}

export class FreetAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of freet {1}!", author, _id);
  }
}
