import Concept, { Session } from "../concept";
import ConceptDb, { ConceptBase } from "../conceptDb";

export interface Friend extends ConceptBase {
  userId: string;
  friendIds: string[];
}

export interface FriendRequest extends ConceptBase {
  fromId: string;
  toId: string;
  status: "pending" | "rejected" | "accepted";
}

class FriendConcept extends Concept<{ friends: Friend; requests: FriendRequest }> {
  async addFriend(otherId: string, session: Session) {
    console.log(`${session.user?.username} is adding ${otherId} as friend!`);
  }
}

const friend = new FriendConcept({
  friends: new ConceptDb<Friend>("friends"),
  requests: new ConceptDb<FriendRequest>("friendRequests"),
});

export default friend;
