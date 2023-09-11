import { Filter, ObjectId } from "mongodb";

import { HttpMethod, Router } from "./framework/router";

import { BadValuesError } from "./concepts/errors";
import { default as FreetConcept, FreetDoc, FreetOptions } from "./concepts/freet";
import FriendConcept, { FriendRequestDoc, FriendshipDoc } from "./concepts/friend";
import SessionConcept, { SessionDoc } from "./concepts/session";
import UserConcept, { UserDoc } from "./concepts/user";
import DocCollection from "./framework/doc";

// App Definition using concepts
const Session = new SessionConcept({});
const User = new UserConcept({ users: new DocCollection<UserDoc>("users") });
const Freet = new FreetConcept({ freets: new DocCollection<FreetDoc>("freets") });
const Friend = new FriendConcept({
  friends: new DocCollection<FriendshipDoc>("friends"),
  requests: new DocCollection<FriendRequestDoc>("friendRequests"),
});

class Routes {
  @Router.get("/users")
  async getUsers(username?: string) {
    return await User.getUsers(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Session.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: SessionDoc, update: Partial<UserDoc>) {
    const user = Session.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Session.getUser(session);
    Session.setUser(session, undefined);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    Session.isLoggedOut(session);
    const u = await User.logIn(username, password);
    Session.setUser(session, u._id);
    const f = await Freet.create(u._id, "Hi, I logged in!");
    return { msg: "Logged in and freeted!", user: u, freet: f };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Session.isLoggedIn(session);
    const user = Session.getUser(session);
    Session.setUser(session, undefined);
    const f = await Freet.create(user, "Bye bye, logging off!");
    return { msg: "Logged out and freeted!", freet: f };
  }

  @Router.get("/freets")
  async getFreets(query: Filter<FreetDoc>) {
    return await Freet.read(query);
  }

  @Router.post("/freets")
  async createFreet(session: SessionDoc, author: ObjectId, content: string, options?: FreetOptions) {
    const user = Session.getUser(session);
    return await Freet.create(user, content, options);
  }

  @Router.patch("/freets/:_id")
  async updateFreet(session: SessionDoc, _id: ObjectId, update: Partial<FreetDoc>) {
    const user = Session.getUser(session);
    await Freet.isAuthorMatch(user, _id);
    return await Freet.update(_id, update);
  }

  @Router.delete("/freets/:_id")
  async deleteFreet(session: SessionDoc, _id: ObjectId) {
    const user = Session.getUser(session);
    await Freet.isAuthorMatch(user, _id);
    return Freet.delete(_id);
  }

  @Router.get("/friends/:user")
  async getFriends(user: ObjectId) {
    return await Friend.getFriends(user);
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: ObjectId) {
    const user = Session.getUser(session);
    await Friend.removeFriend(user, friend);
  }

  @Router.get("/requests")
  async getRequests(session: SessionDoc) {
    const user = Session.getUser(session);
    return await Friend.getRequests(user);
  }

  @Router.delete("/requests/:to")
  async removeRequest(session: SessionDoc, to: ObjectId) {
    const user = Session.getUser(session);
    return await Friend.removeRequest(user, to);
  }

  @Router.put("/requests/:from")
  async respondRequest(session: SessionDoc, from: ObjectId, response: string) {
    if (response !== "accepted" && response !== "rejected") {
      throw new BadValuesError("response needs to be 'accepted' or 'rejected'");
    }
    const user = Session.getUser(session);
    return await Friend.respondRequest(user, from, response);
  }

  // manager -> concept
  // sendFriendRequest
  @Router.post("/requests/:to")
  async sendRequest(session: SessionDoc, to: ObjectId) {
    await User.userExists(to);
    const user = Session.getUser(session);
    return await Friend.sendRequest(user, to);
  }
}

/**
 * @returns An Express router instance with all the routes in {@link Routes} registered.
 */
function getExpressRouter() {
  const router = new Router();
  const routes = new Routes();

  // Get all methods in the Routes class (e.g., getUsers, createUser, etc).
  const endpoints = Object.getOwnPropertyNames(Object.getPrototypeOf(routes));

  // Register the methods as routes in `router`.
  for (const endpoint of endpoints) {
    // Get the method and path metadata from the routes object.
    // These come from decorators in the Routes class.
    const method = Reflect.getMetadata("method", routes, endpoint) as HttpMethod;
    const path = Reflect.getMetadata("path", routes, endpoint) as string;

    // Skip if the method or path is not defined (e.g., when endpoint is the constructor)
    if (!method || !path) {
      continue;
    }

    // The ugly cast is because TypeScript doesn't know that `routes[endpoint]` is a correct method.
    const action = (routes as unknown as Record<string, Function>)[endpoint];

    router.registerRoute(method, path, action);
  }

  return router.expressRouter;
}

// Export the Express router instance.
export default getExpressRouter();
