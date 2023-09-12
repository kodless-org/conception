import { Filter, ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Freet, Friend, User, WebSession } from "./app";
import { BadValuesError } from "./concepts/errors";
import { FreetDoc, FreetOptions } from "./concepts/freet";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";

// ErrorHandler.register(FreetAuthorNotMatchError, (e: FreetAuthorNotMatchError) => {
//   const username = (await User.getUserById(e.author)).username;
//   return e.formatWith(username, e._id);
// });

// export class ErrorHandler {
//   static async FreetAuthorNotMatchError(e: FreetAuthorNotMatchError) {
//     const username = (await User.getUserById(e.author)).username;
//     return e.formatWith(username, e._id);
//   }

//   static async FriendNotFoundError(e: FriendNotFoundError) {
//     const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
//     return e.formatWith(user1.username, user2.username);
//   }

//   static async FriendRequestAlreadyExistsError(e: FriendRequestAlreadyExistsError) {
//     const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
//     return e.formatWith(user1.username, user2.username);
//   }

//   static async FriendRequestNotFoundError(e: FriendRequestNotFoundError) {
//     const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
//     return e.formatWith(user1.username, user2.username);
//   }

//   static async AlreadyFriendsError(e: AlreadyFriendsError) {
//     const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
//     return e.formatWith(user1.username, user2.username);
//   }
// }

class Routes {
  @Router.get("/users")
  async getUsers(username?: string) {
    return await User.getUsers(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.setUser(session, undefined);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    const u = await User.logIn(username, password);
    WebSession.setUser(session, u._id);
    const f = await Freet.create(u._id, "Hi, I logged in!");
    return { msg: "Logged in and freeted!", user: u, freet: f };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.isLoggedIn(session);
    const user = WebSession.getUser(session);
    WebSession.setUser(session, undefined);
    const f = await Freet.create(user, "Bye bye, logging off!");
    return { msg: "Logged out and freeted!", freet: f };
  }

  @Router.get("/freets")
  async getFreets(query: Filter<FreetDoc>) {
    return await Freet.read(query);
  }

  @Router.post("/freets")
  async createFreet(session: WebSessionDoc, author: ObjectId, content: string, options?: FreetOptions) {
    const user = WebSession.getUser(session);
    return await Freet.create(user, content, options);
  }

  @Router.patch("/freets/:_id")
  async updateFreet(session: WebSessionDoc, _id: ObjectId, update: Partial<FreetDoc>) {
    const user = WebSession.getUser(session);
    await Freet.isAuthorMatch(user, _id);
    return await Freet.update(_id, update);
  }

  @Router.delete("/freets/:_id")
  async deleteFreet(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Freet.isAuthorMatch(user, _id);
    return Freet.delete(_id);
  }

  @Router.get("/friends/:user")
  async getFriends(user: ObjectId) {
    return await Friend.getFriends(user);
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: ObjectId) {
    const user = WebSession.getUser(session);
    await Friend.removeFriend(user, friend);
  }

  @Router.get("/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Friend.getRequests(user);
  }

  @Router.delete("/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: ObjectId) {
    const user = WebSession.getUser(session);
    return await Friend.removeRequest(user, to);
  }

  @Router.put("/requests/:from")
  async respondFriendRequest(session: WebSessionDoc, from: ObjectId, response: string) {
    if (response !== "accepted" && response !== "rejected") {
      throw new BadValuesError("response needs to be 'accepted' or 'rejected'");
    }
    const user = WebSession.getUser(session);
    return await Friend.respondRequest(user, from, response);
  }

  @Router.post("/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: ObjectId) {
    await User.userExists(to);
    const user = WebSession.getUser(session);
    return await Friend.sendRequest(user, to);
  }
}

export default getExpressRouter(new Routes());
