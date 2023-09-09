import { Filter, ObjectId } from "mongodb";

import { HttpMethod, Router } from "./framework/router";

import { BadValuesError } from "./concepts/errors";
import freetManager, { Freet, PureFreet } from "./concepts/freet";
import friendManager from "./concepts/friend";
import sessionManager, { Session } from "./concepts/session";
import userManager, { UserDoc } from "./concepts/user";

class Routes {
  @Router.get("/users")
  async getUsers(username?: string) {
    return await userManager.getUsers(username);
  }

  @Router.post("/users")
  async createUser(session: Session, username: string, password: string) {
    sessionManager.isLoggedOut(session);
    return await userManager.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: Session, update: Partial<UserDoc>) {
    const user = sessionManager.getUser(session);
    return await userManager.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: Session) {
    const user = sessionManager.getUser(session);
    sessionManager.setUser(session, undefined);
    return await userManager.delete(user);
  }

  @Router.post("/login")
  async logIn(session: Session, username: string, password: string) {
    sessionManager.isLoggedOut(session);
    const u = await userManager.logIn(username, password);
    sessionManager.setUser(session, u._id);
    const f = await freetManager.create({ content: "Hi, I logged in!", author: u._id });
    return { msg: "Logged in and freeted!", user: u, freet: f };
  }

  @Router.post("/logout")
  async logOut(session: Session) {
    sessionManager.isLoggedIn(session);
    const user = sessionManager.getUser(session);
    sessionManager.setUser(session, undefined);
    const f = await freetManager.create({ content: "Bye bye, logging off!", author: user });
    return { msg: "Logged out and freeted!", freet: f };
  }

  @Router.get("/freets")
  async getFreets(query: Filter<Freet>) {
    return await freetManager.read(query);
  }

  @Router.post("/freets")
  async createFreet(session: Session, freet: PureFreet) {
    // Note that even though type of `freet` is `PureFreet`, it should
    // not contain the `author` property. This is OK to have in TypeScript
    // as long as we populate it ourselves by overriding.

    const user = sessionManager.getUser(session);
    return await freetManager.create({ ...freet, author: user });
  }

  @Router.patch("/freets/:_id")
  async updateFreet(session: Session, _id: ObjectId, update: Partial<PureFreet>) {
    const user = sessionManager.getUser(session);
    await freetManager.isAuthorMatch(user, _id);
    return await freetManager.update(_id, update);
  }

  @Router.delete("/freets/:_id")
  async deleteFreet(session: Session, _id: ObjectId) {
    const user = sessionManager.getUser(session);
    await freetManager.isAuthorMatch(user, _id);
    return freetManager.delete(_id);
  }

  @Router.get("/friends/:user")
  async getFriends(user: ObjectId) {
    return await friendManager.getFriends(user);
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: Session, friend: ObjectId) {
    const user = sessionManager.getUser(session);
    await friendManager.removeFriend(user, friend);
  }

  @Router.get("/requests")
  async getRequests(session: Session) {
    const user = sessionManager.getUser(session);
    return await friendManager.getRequests(user);
  }

  @Router.delete("/requests/:to")
  async removeRequest(session: Session, to: ObjectId) {
    const user = sessionManager.getUser(session);
    return await friendManager.removeRequest(user, to);
  }

  @Router.put("/requests/:from")
  async respondRequest(session: Session, from: ObjectId, response: string) {
    if (response !== "accepted" && response !== "rejected") {
      throw new BadValuesError("response needs to be 'accepted' or 'rejected'");
    }
    const user = sessionManager.getUser(session);
    return await friendManager.respondRequest(user, from, response);
  }

  // manager -> concept
  // sendFriendRequest
  @Router.post("/requests/:to")
  async sendRequest(session: Session, to: ObjectId) {
    await userManager.userExists(to);
    const user = sessionManager.getUser(session);
    return await friendManager.sendRequest(user, to);
  }
}

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
