import Concept, { HttpError, Session } from "../concept";
import ConceptDb, { ConceptBase } from "../conceptDb";
import { Validators } from "../utils";

export interface Friend extends ConceptBase {
  username: string;
  friends: string[]; // list of usernames
}

export interface FriendRequest extends ConceptBase {
  from: string; // username
  to: string; // username
  status: "pending" | "rejected" | "accepted";
}

class FriendConcept extends Concept<{ friends: Friend; requests: FriendRequest }> {
  async sendRequest(to: string, session: Session) {
    Validators.isLoggedIn(session);
    const username = session.user?.username!;
    await this.canSendRequest(username, to);
    await this.db.requests.createOne({
      from: username,
      to,
      status: "pending"
    });
  }

  async respondRequest(from: string, response: "accept" | "reject", session: Session) {
    Validators.isLoggedIn(session);
    const username = session.user?.username!;
    const request = await this.db.requests.popOne({
      from, to: username,
      status: "pending"
    });
    if (!request) {
      throw new HttpError(401, `There was no pending request from ${from}!`);
    }

  }

  async isNotFriends(u1: string, u2: string) {
    // friendship is symmetric, check only one friend list
    const friends1 = await this.db.friends.readOne({ userId: u1 });
    if (friends1 && friends1.friendIds.includes(u2)) {
      throw new HttpError(401, "These users are already friends!");
    }
  }

  async canSendRequest(u1: string, u2: string) {
    this.isNotFriends(u1, u2);
    // check if there is pending request from either of these users
    const request = await this.db.requests.readOne({
      fromId: { $in: [u1, u2] },
      status: "pending"
    });
    if (request) {
      throw new HttpError(401, "There is already a friend request between these users!");
    }
  }
}

const friend = new FriendConcept({
  friends: new ConceptDb<Friend>("friends"),
  requests: new ConceptDb<FriendRequest>("friendRequests"),
});

export default friend;
