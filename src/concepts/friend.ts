import Concept, { HttpError, Session } from "../concept";
import ConceptDb, { ConceptBase } from "../conceptDb";
import { Validators } from "../utils";

export interface Friend extends ConceptBase {
  // usernames of friends for each friendship, in no specific order
  friend1: string;
  friend2: string;
}

export interface FriendRequest extends ConceptBase {
  // usernames of from and to
  from: string;
  to: string;
  status: "pending" | "rejected" | "accepted";
}

class FriendConcept extends Concept<{ friends: Friend; requests: FriendRequest }> {
  async getRequests(session: Session) {
    console.log(session);
    Validators.isLoggedIn(session);
    const username = session.user?.username ?? "";
    return await this.db.requests.readMany({
      $or: [{ from: username }, { to: username }],
    });
  }

  async sendRequest(to: string, session: Session) {
    Validators.isLoggedIn(session);
    const username = session.user?.username ?? "";
    await this.canSendRequest(username, to);
    await this.db.requests.createOne({
      from: username,
      to,
      status: "pending",
    });
    return { msg: "Sent request!" };
  }

  async respondRequest(from: string, response: "accepted" | "rejected", session: Session) {
    Validators.isLoggedIn(session);
    const username = session.user?.username ?? "";
    const request = await this.db.requests.popOne({
      from,
      to: username,
      status: "pending",
    });
    if (!request) {
      throw new HttpError(401, `There was no pending request from ${from}!`);
    }
    void this.db.requests.createOne({
      from,
      to: username,
      status: response,
    });

    // if accepted, add a new friend
    if (response === "accepted") {
      void this.addFriend(username, from);
    }

    return {
      msg: "Responded!",
    };
  }

  async removeRequest(to: string, session: Session) {
    Validators.isLoggedIn(session);
    const username = session.user?.username ?? "";
    const request = await this.db.requests.popOne({
      from: username,
      to,
      status: "pending",
    });
    if (request === null) {
      throw new HttpError(401, `No pending request existed to ${to}!`);
    }
    return { msg: "Removed request!" };
  }

  async removeFriend(friend: string, session: Session) {
    Validators.isLoggedIn(session);
    const username = session.user?.username ?? "";
    const friendship = await this.db.friends.popOne({
      $or: [
        { friend1: username, friend2: friend },
        { friend1: friend, friend2: username },
      ],
    });
    if (friendship === null) {
      throw new HttpError(401, `You were not friends with ${friend}!`);
    }
    return { msg: "Unfriended!" };
  }

  async getFriends(user: string) {
    const friendships = await this.db.friends.readMany({
      $or: [{ friend1: user }, { friend2: user }],
    });
    return friendships.map((ship) => (ship.friend1 === user ? ship.friend2 : ship.friend1));
  }

  private async addFriend(friend1: string, friend2: string) {
    void this.db.friends.createOne({ friend1, friend2 });
  }

  private async isNotFriends(u1: string, u2: string) {
    const friendship = await this.db.friends.readOne({
      $or: [
        { friend1: u1, friend2: u2 },
        { friend1: u2, friend2: u1 },
      ],
    });
    if (friendship !== null) {
      throw new HttpError(401, `${u1} and ${u2} users are already friends!`);
    }
  }

  private async canSendRequest(u1: string, u2: string) {
    if (u1 === u2) {
      throw new HttpError(400, "Yes, you are your friend!");
    }
    void this.isNotFriends(u1, u2);
    // check if there is pending request from either of these users
    const request = await this.db.requests.readOne({
      from: { $in: [u1, u2] },
      status: "pending",
    });
    if (request) {
      throw new HttpError(401, `There is already a friend request between ${u1} and ${u2}!`);
    }
  }
}

const friend = new FriendConcept({
  friends: new ConceptDb<Friend>("friends"),
  requests: new ConceptDb<FriendRequest>("friendRequests"),
});

export default friend;
