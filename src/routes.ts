import { Filter } from "mongodb";

import { Router } from "./framework/router";

import { BadValuesError } from "./concepts/errors";
import freetManager, { Freet, PureFreet } from "./concepts/freet";
import friendManager from "./concepts/friend";
import sessionManager, { Session } from "./concepts/session";
import userManager, { User } from "./concepts/user";

// TODO: try converting all of these to methods with decorators

class Routes {
  @Router.get("/users")
  async getUsers(username?: string) {
    return await userManager.getUsers(username);
  }

  @Router.post("/users")
  async createUser(session: Session, user: User) {
    sessionManager.isLoggedOut(session);
    return await userManager.create(user);
  }

  @Router.patch("/users")
  async updateUser(session: Session, update: Partial<User>) {
    const userId = sessionManager.getUser(session)._id;
    return await userManager.update(userId, update);
  }

  @Router.delete("/users")
  async deleteUser(session: Session) {
    const userId = sessionManager.getUser(session)._id;
    sessionManager.setUser(session, undefined);
    return await userManager.delete(userId);
  }

  @Router.post("/login")
  async logIn(session: Session, username: string, password: string) {
    sessionManager.isLoggedOut(session);
    const u = await userManager.logIn(username, password);
    const userId = u._id.toString();
    sessionManager.setUser(session, { username: username, _id: userId });
    const f = await freetManager.create({ content: "Hi, I logged in!", author: userId });
    return { msg: "Logged in and freeted!", user: u, freet: f };
  }

  @Router.post("/logout")
  async logOut(session: Session) {
    sessionManager.isLoggedIn(session);
    const userId = sessionManager.getUser(session)._id;
    sessionManager.setUser(session, undefined);
    const f = await freetManager.create({ content: "Bye bye, logging off!", author: userId });
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

    const userId = sessionManager.getUser(session)._id;
    return await freetManager.create({ ...freet, author: userId });
  }

  @Router.patch("/freets/:_id")
  async updateFreet(session: Session, _id: string, update: Partial<PureFreet>) {
    const userId = sessionManager.getUser(session)._id;
    await freetManager.isAuthorMatch(userId, _id);
    return await freetManager.update(_id, update);
  }

  @Router.delete("/freets/:_id")
  async deleteFreet(session: Session, _id: string) {
    const userId = sessionManager.getUser(session)._id;
    await freetManager.isAuthorMatch(userId, _id);
    return freetManager.delete(_id);
  }

  @Router.get("/friends/:userId")
  async getFriends(userId: string) {
    return await friendManager.getFriends(userId);
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: Session, friendId: string) {
    const userId = sessionManager.getUser(session)._id;
    await friendManager.removeFriend(userId, friendId);
  }

  @Router.get("/requests")
  async getRequests(session: Session) {
    const userId = sessionManager.getUser(session)._id;
    return await friendManager.getRequests(userId);
  }

  @Router.delete("/requests/:to")
  async removeRequest(session: Session, to: string) {
    const userId = sessionManager.getUser(session)._id;
    return await friendManager.removeRequest(userId, to);
  }

  @Router.put("/requests/:from")
  async respondRequest(session: Session, to: string, response: string) {
    if (response !== "accepted" && response !== "rejected") {
      throw new BadValuesError("response needs to be 'accepted' or 'rejected'");
    }
    const userId = sessionManager.getUser(session)._id;
    return await friendManager.respondRequest(userId, to, response);
  }

  @Router.post("/requests/:to")
  async sendRequest(session: Session, to: string) {
    const userId = sessionManager.getUser(session)._id;
    await userManager.userExists(to);
    return await friendManager.sendRequest(userId, to);
  }
}

// Do not edit code below this line.
const router = new Router();
const routes = new Routes();

// Get all methods in the Routes class.
const endpoints = Object.getOwnPropertyNames(Object.getPrototypeOf(routes));

endpoints.forEach((endpoint) => {
  // Get the method and path metadata from the routes object.
  // These come from decorators in the Routes class.
  const method = Reflect.getMetadata("method", routes, endpoint) as string;
  const path = Reflect.getMetadata("path", routes, endpoint) as string;

  // The ugly cast is because TypeScript doesn't know that router[method] is a function.
  const caller = (router as unknown as Record<string, Function>)[method];
  const handler = (routes as unknown as Record<string, Function>)[endpoint];

  // Call the method on the router with the path and handler.
  if (caller) {
    caller.call(router, path, handler);
  }
});

// Export the Express router instance.
export default router.router;
