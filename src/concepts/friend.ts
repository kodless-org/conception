import Concept from "../framework/concept";
import ConceptDb, { CollectionBase } from "../framework/conceptDb";
import { NotAllowedError, NotFoundError } from "./errors";

type UserId = string;

export interface Friend extends CollectionBase {
  user1: UserId;
  user2: UserId;
}

export interface FriendRequest extends CollectionBase {
  from: UserId;
  to: UserId;
  status: "pending" | "rejected" | "accepted";
}

class FriendConcept extends Concept<{ friends: Friend; requests: FriendRequest }> {
  async getRequests(userId: UserId) {
    return await this.db.requests.readMany({
      $or: [{ from: userId }, { to: userId }],
    });
  }

  async sendRequest(from: UserId, to: UserId) {
    await this.canSendRequest(from, to);
    await this.db.requests.createOne({ from, to, status: "pending" });
    return { msg: "Sent request!" };
  }

  async respondRequest(from: UserId, to: UserId, response: "accepted" | "rejected") {
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

  async removeRequest(from: UserId, to: UserId) {
    const request = await this.db.requests.popOne({ from, to, status: "pending" });
    if (request === null) {
      throw new NotFoundError(`No pending request existed from ${from} to ${to}!`);
    }
    return { msg: "Removed request!" };
  }

  async removeFriend(user: UserId, friend: UserId) {
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

  async getFriends(user: UserId) {
    const friendships = await this.db.friends.readMany({
      $or: [{ user1: user }, { user2: user }],
    });
    return friendships.map((friendship) => (friendship.user1 === user ? friendship.user2 : friendship.user1));
  }

  private async addFriend(user1: UserId, user2: UserId) {
    void this.db.friends.createOne({ user1, user2 });
  }

  private async isNotFriends(u1: UserId, u2: UserId) {
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

  private async canSendRequest(u1: UserId, u2: UserId) {
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
