import ConceptDb, { ConceptBase } from "../conceptDb";
import Concept, { HttpError, type Session } from "../concept";
import { Filter, ObjectId } from "mongodb";
import { Validators } from "utils";

export interface Freet extends ConceptBase {
  author: string;
  content: string;
}

class FreetConcept extends Concept<{ freets: Freet }> {
  async create(freet: Freet, session: Session) {
    this.isOwner(freet, session);

    const _id = (await this.db.freets.createOne(freet)).insertedId;
    return { freet: { ...freet, _id } };
  }

  async read(query: Filter<Freet>) {
    const freets = await this.db.freets.readMany(query, {
      'sort': { dateUpdated: -1 }
    });
    return { freets };
  }

  async update(_id: string, update: Partial<Freet>, session: Session) {
    Validators.isLoggedIn(session);
    if (update.author !== undefined && update.author !== session.user?.username) {
      throw new HttpError(403, "You cannot update other's freets!");
    }

    const id = new ObjectId(_id);
    await this.db.freets.updateOneById(id, update);
    return { freet: await this.db.freets.readOneById(id) };
  }

  async delete(_id: string) {
    const freet = await this.db.freets.readOneById(new ObjectId(_id));
    if (!freet || !freet?.author) {
      throw new HttpError(403, "Not allowed to delete this freet.");
    }

    await this.db.freets.deleteOneById(freet._id);
    return { freet };
  }

  async isOwner(freet: Freet, session: Session) {
    if (freet.author !== session.user?.username) {
      throw new HttpError(401, "You don't own this freet!");
    }
  }
}

const freet = new FreetConcept(
  { freets: new ConceptDb<Freet>("freets") }
);


export default freet;