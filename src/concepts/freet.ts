import { Filter, ObjectId } from "mongodb";

import Concept, { HttpError, Session } from "../concept";
import ConceptDb, { ConceptBase } from "../conceptDb";
import { Validators } from "../utils";

export interface Freet extends ConceptBase {
  authorId: string;
  content: string;
}

class FreetConcept extends Concept<{ freets: Freet }> {
  async create(content: string, session: Session) {
    Validators.isLoggedIn(session);
    const _id = (await this.db.freets.createOne({ authorId: session.user?.username, content } as Freet)).insertedId;
    return { freet: { ...freet, _id } };
  }

  async read(query: Filter<Freet>) {
    const freets = await this.db.freets.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return { freets };
  }

  async update(_id: string, update: Partial<Freet>, session: Session) {
    Validators.isLoggedIn(session);
    if (update.authorId !== undefined && update.authorId !== session.user?.username) {
      throw new HttpError(403, "You cannot update other's freets!");
    }

    const id = new ObjectId(_id);
    await this.db.freets.updateOneById(id, update);
    return { freet: await this.db.freets.readOneById(id) };
  }

  async delete(_id: string, session: Session) {
    Validators.isLoggedIn(session);
    const freet = await this.db.freets.readOneById(new ObjectId(_id));
    if (!freet || !freet?.authorId) {
      throw new HttpError(403, "Not allowed to delete this freet.");
    }

    await this.db.freets.deleteOneById(freet._id);
    return { freet };
  }

  async isOwner(freet: Freet, session: Session) {
    Validators.isLoggedIn(session);
    if (freet.authorId !== session.user?.username) {
      throw new HttpError(401, "You don't own this freet!");
    }
  }
}

const freet = new FreetConcept({ freets: new ConceptDb<Freet>("freets") });

export default freet;
