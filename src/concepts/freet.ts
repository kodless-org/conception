import { Filter, ObjectId, WithId } from "mongodb";
import ConceptDb from "../conceptDb";
import ConceptRouter, { ExpressMiddleware } from "../conceptRouter";
import { NextFunction, Request, Response } from "express";

interface Freet {
  author: string;
  content: string;
}

class FreetDb extends ConceptDb<Freet> {
  // example for convenience:
  async getAuthorFreets(name: string): Promise<WithId<Freet>[]> {
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

const freet = new ConceptRouter<Freet>("freet");

freet.create();
freet.read();
// boom, now we can create and read freets in two lines!

/*
More interesting example:
e.g., make sure you are logged in before creating a freet, and after you create one, notify friends
freet.create([loggedIn, validateCreate], [nofifyFriends]);

Idea: have more generalized validation since it comes up all the time
and writing it inside array is not as elegant!
*/

// let's make more complex router
class FreetRouter extends ConceptRouter<Freet> {
  // e.g., skip happensBefore and happensAfter since I don't want them for this!
  async spamFritter() {
    this.router.post("/spam", async (req: Request, res: Response, next: NextFunction) => {
      const freet = req.body.document as Freet;
      this.db.createMany([{...freet}, {...freet}, {...freet}, {...freet}]);
      res.json({ message: "CHAOS!" });
    });
  }
}

const chaosFreet = new FreetRouter("chaosFreet");
chaosFreet.create();
chaosFreet.read();
chaosFreet.spamFritter();

export default freet;