import Concept from "../framework/concept";
import ConceptDb, { CollectionBase } from "../framework/conceptDb";
import { NotAllowedError, NotFoundError } from "./errors";

export interface Friend extends CollectionBase {
  user1: string;
  user2: string;
}

export interface FriendRequest extends CollectionBase {
  from: string;
  to: string;
  status: "pending" | "rejected" | "accepted";
}

class FriendConcept extends Concept<{ friends: Friend; requests: FriendRequest }> {
  async getRequests(userId: string) {
    return await this.db.requests.readMany({
      $or: [{ from: userId }, { to: userId }],
    });
  }

  async sendRequest(from: string, to: string) {
    await this.canSendRequest(from, to);
    await this.db.requests.createOne({ from, to, status: "pending" });
    return { msg: "Sent request!" };
  }

  async respondRequest(from: string, to: string, response: "accepted" | "rejected") {
    const request = await this.db.requests.popOne({ from, to, status: "pending" });
    if (request === null) {
      throw new NotFoundError(`There was no pending request from ${from} to ${to}!`);
    }
    void this.db.requests.createOne({ from, to, status: response });

    // if accepted, add a new friend
    if (response === "accepted") {
      void this.addFriend(from, to);
    }

    return { msg: `Responded with ${response}!` };
  }

  async removeRequest(from: string, to: string) {
    const request = await this.db.requests.popOne({ from, to, status: "pending" });
    if (request === null) {
      throw new NotFoundError(`No pending request existed from ${from} to ${to}!`);
    }
    return { msg: "Removed request!" };
  }

  async removeFriend(user: string, friend: string) {
    const friendship = await this.db.friends.popOne({
      $or: [
        { user1: user, user2: friend },
        { user1: friend, user2: user },
      ],
    });
    if (friendship === null) {
      throw new NotFoundError(`${user} was not friends with ${friend}!`);
    }
    return { msg: "Unfriended!" };
  }

  async getFriends(user: string) {
    const friendships = await this.db.friends.readMany({
      $or: [{ user1: user }, { user2: user }],
    });
    return friendships.map((friendship) => (friendship.user1 === user ? friendship.user2 : friendship.user1));
  }

  private async addFriend(user1: string, user2: string) {
    void this.db.friends.createOne({ user1, user2 });
  }

  private async isNotFriends(u1: string, u2: string) {
    const friendship = await this.db.friends.readOne({
      $or: [
        { user1: u1, user2: u2 },
        { user1: u2, user2: u1 },
      ],
    });
    if (friendship !== null) {
      throw new NotAllowedError(`${u1} and ${u2} users are already friends!`);
    }
  }

  private async canSendRequest(u1: string, u2: string) {
    if (u1 === u2) {
      throw new NotAllowedError(":)");
    }
    await this.isNotFriends(u1, u2);
    // check if there is pending request between these users
    const request = await this.db.requests.readOne({
      from: { $in: [u1, u2] },
      to: { $in: [u1, u2] },
      status: "pending",
    });
    if (request !== null) {
      throw new NotAllowedError(`There is already a friend request between ${u1} and ${u2}!`);
    }
  }
}

const friendManager = new FriendConcept({
  friends: new ConceptDb<Friend>("friends"),
  requests: new ConceptDb<FriendRequest>("friendRequests"),
});

export default friendManager;
