import { Filter } from "mongodb";

import { Router } from "./framework/router";

import { BadValuesError } from "./concepts/errors";
import freetManager, { Freet, PureFreet } from "./concepts/freet";
import friendManager from "./concepts/friend";
import sessionManager, { Session } from "./concepts/session";
import userManager, { User } from "./concepts/user";

// TODO: try converting all of these to methods with decorators

export const userRouter = new Router("user");

userRouter.get("/", async (username?: string) => {
  return await userManager.getUsers(username);
});

userRouter.post("/", async (session: Session, user: User) => {
  sessionManager.isLoggedOut(session);
  return await userManager.create(user);
});

userRouter.patch("/", async (session: Session, update: Partial<User>) => {
  const userId = sessionManager.getUser(session)._id;
  return await userManager.update(userId, update);
});

userRouter.delete("/", async (session: Session) => {
  const userId = sessionManager.getUser(session)._id;
  sessionManager.setUser(session, undefined);
  return await userManager.delete(userId);
});

userRouter.post("/login", async (session: Session, username: string, password: string) => {
  sessionManager.isLoggedOut(session);
  const u = await userManager.logIn(username, password);
  const userId = u._id.toString();
  sessionManager.setUser(session, { username: username, _id: userId });
  const f = await freetManager.create({ content: "Hi, I logged in!", author: userId });
  return { msg: "Logged in and freeted!", user: u, freet: f };
});

userRouter.post("/logout", async (session: Session) => {
  sessionManager.isLoggedIn(session);
  const userId = sessionManager.getUser(session)._id;
  sessionManager.setUser(session, undefined);
  const f = await freetManager.create({ content: "Bye bye, logging off!", author: userId });
  return { msg: "Logged out and freeted!", freet: f };
});

export const freetRouter = new Router("freet");

freetRouter.get("/", async (query: Filter<Freet>) => {
  return await freetManager.read(query);
});

// Note that even though type of `freet` is `PureFreet`, it should
// not contain the `author` property. This is OK to have in TypeScript
// as long as we populate it ourselves by overriding.
freetRouter.post("/", async (session: Session, freet: PureFreet) => {
  const userId = sessionManager.getUser(session)._id;
  return await freetManager.create({ ...freet, author: userId });
});

freetRouter.get("/", async (query: Filter<Freet>) => {
  return await freetManager.read(query);
});

freetRouter.patch("/:_id", async (session: Session, _id: string, update: Partial<PureFreet>) => {
  const userId = sessionManager.getUser(session)._id;
  await freetManager.isAuthorMatch(userId, _id);
  return await freetManager.update(_id, update);
});

freetRouter.delete("/:_id", async (session: Session, _id: string) => {
  const userId = sessionManager.getUser(session)._id;
  await freetManager.isAuthorMatch(userId, _id);
  return freetManager.delete(_id);
});

export const friendRouter = new Router("friend");

friendRouter.get("/friends/:userId", async (userId: string) => {
  return await friendManager.getFriends(userId);
});

friendRouter.delete("/friends/:friend", async (session: Session, friendId: string) => {
  const userId = sessionManager.getUser(session)._id;
  await friendManager.removeFriend(userId, friendId);
});

friendRouter.get("/requests", async (session: Session) => {
  const userId = sessionManager.getUser(session)._id;
  return await friendManager.getRequests(userId);
});

friendRouter.delete("/requests/:to", async (session: Session, to: string) => {
  const userId = sessionManager.getUser(session)._id;
  return await friendManager.removeRequest(userId, to);
});

friendRouter.put("/requests/:from", async (session: Session, to: string, response: string) => {
  if (response !== "accepted" && response !== "rejected") {
    throw new BadValuesError("response needs to be 'accepted' or 'rejected'");
  }
  const userId = sessionManager.getUser(session)._id;
  return await friendManager.respondRequest(userId, to, response);
});

friendRouter.post("/requests/:to", async (session: Session, to: string) => {
  const userId = sessionManager.getUser(session)._id;
  await userManager.userExists(to);
  return await friendManager.sendRequest(userId, to);
});
