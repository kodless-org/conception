import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FriendshipDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId;
}

export interface FriendRequestDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
  status: "pending" | "rejected" | "accepted";
}

export default class FriendConcept {
  public readonly friends = new DocCollection<FriendshipDoc>("friends");
  public readonly requests = new DocCollection<FriendRequestDoc>("friendRequests");

  async getRequests(user: ObjectId) {
    return await this.requests.readMany({
      $or: [{ from: user }, { to: user }],
    });
  }

  async sendRequest(from: ObjectId, to: ObjectId) {
    await this.canSendRequest(from, to);
    await this.requests.createOne({ from, to, status: "pending" });
    return { msg: "Sent request!" };
  }

  async respondRequest(from: ObjectId, to: ObjectId, response: "accepted" | "rejected") {
    const request = await this.requests.popOne({ from, to, status: "pending" });
    if (request === null) {
      throw new FriendRequestNotFoundError(from, to);
    }
    void this.requests.createOne({ from, to, status: response });

    // if accepted, add a new friend
    if (response === "accepted") {
      void this.addFriend(from, to);
    }

    return { msg: `Responded with ${response}!` };
  }

  async removeRequest(from: ObjectId, to: ObjectId) {
    const request = await this.requests.popOne({ from, to, status: "pending" });
    if (request === null) {
      throw new FriendRequestNotFoundError(from, to);
    }
    return { msg: "Removed request!" };
  }

  async removeFriend(user: ObjectId, friend: ObjectId) {
    const friendship = await this.friends.popOne({
      $or: [
        { user1: user, user2: friend },
        { user1: friend, user2: user },
      ],
    });
    if (friendship === null) {
      throw new FriendNotFoundError(user, friend);
    }
    return { msg: "Unfriended!" };
  }

  async getFriends(user: ObjectId) {
    const friendships = await this.friends.readMany({
      $or: [{ user1: user }, { user2: user }],
    });
    return friendships.map((friendship) => (friendship.user1 === user ? friendship.user2 : friendship.user1));
  }

  private async addFriend(user1: ObjectId, user2: ObjectId) {
    void this.friends.createOne({ user1, user2 });
  }

  private async isNotFriends(u1: ObjectId, u2: ObjectId) {
    const friendship = await this.friends.readOne({
      $or: [
        { user1: u1, user2: u2 },
        { user1: u2, user2: u1 },
      ],
    });
    if (friendship !== null || u1 === u2) {
      throw new AlreadyFriendsError(u1, u2);
    }
  }

  private async canSendRequest(u1: ObjectId, u2: ObjectId) {
    await this.isNotFriends(u1, u2);
    // check if there is pending request between these users
    const request = await this.requests.readOne({
      from: { $in: [u1, u2] },
      to: { $in: [u1, u2] },
      status: "pending",
    });
    if (request !== null) {
      throw new FriendRequestAlreadyExistsError(u1, u2);
    }
  }
}

export class FriendRequestNotFoundError extends NotFoundError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Friend request from {0} to {1} does not exist!", from, to);
  }
}

export class FriendRequestAlreadyExistsError extends NotAllowedError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Friend request from {0} to {1} already exists!", from, to);
  }
}

export class FriendNotFoundError extends NotFoundError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("Friendship between {0} and {1} does not exist!", user1, user2);
  }
}

export class AlreadyFriendsError extends NotAllowedError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("{0} and {1} are already friends!", user1, user2);
  }
}
