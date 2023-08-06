import ConceptDb, { ConceptBase } from "../conceptDb";
import ConceptRouter, { HttpError, Session } from "../conceptRouter";

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
freet.router.patch("/:_id", ...freet.handlers("update"));
freet.router.delete("/:_id", ...freet.handlers("delete"));

export default freet;