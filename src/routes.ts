import express from "express";
import { ConceptRouter } from "./conceptRouter";
import { makeRoute } from "./utils";

import user, { User } from "./concepts/user";
import freet, { Freet } from "./concepts/freet";
import { Session } from "./concept";

export const userRouter = new ConceptRouter(user);
userRouter.get("/", "readSafe");
userRouter.post("/", "create");
userRouter.patch("/", "update");
userRouter.delete("/", "delete");

export const freetRouter = new ConceptRouter(freet);
freetRouter.get("/", "read");
freetRouter.post("/", "create");
freetRouter.patch("/:_id", "update");
freetRouter.delete("/:_id", "delete");

export const syncRouter = express.Router();
syncRouter.post("/login", makeRoute(login));
syncRouter.post("/logout", makeRoute(logout));

async function login(document: User, session: Session) {
  const u = await user.act("login", {document, session});
  const f = await freet.act("create", {document: {author: session.user?.username, content: "Hi, I logged in!"} as Freet, session});
  return {msg: "Logged in and freeted!", user: u, freet: f};
}

async function logout(document: User, session: Session) {
  const u = await user.act("logout", {document, session});
  const f = await freet.act("create", {document: {author: session.user?.username, content: "Bye bye, logging off!"} as Freet, session});
  return {msg: "Logged out and freeted!", user: u, freet: f};
}
