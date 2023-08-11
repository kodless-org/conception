import ConceptDb, { ConceptBase } from "../conceptDb";
import Concept, { HttpError, Session } from "../concept";

export interface Freet extends ConceptBase {
  author: string;
  content: string;
}

export class FreetValidators {
  static async isOwner(document: Freet, session: Session) {
    if (document.author !== session.user?.username) {
      throw new HttpError(401, "You don't own this freet!");
    }
  }
}

const freetDb = new ConceptDb<Freet>("freet");
const freet = new Concept<Freet>(freetDb);

freet.defineAction("create", freet.utilActions.create, [FreetValidators.isOwner]);
freet.defineAction("delete", freet.utilActions.delete, [FreetValidators.isOwner]);
freet.defineAction("update", freet.utilActions.update, [FreetValidators.isOwner]);
freet.defineAction("read", freet.utilActions.read);

export default freet;