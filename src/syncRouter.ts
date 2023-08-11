import express from "express";

import user, { User } from "./concepts/user";
import freet, { Freet } from "./concepts/freet";
import { Session } from "./concept";
import { makeRoute } from "./utils";

const syncRouter = express.Router();

// TODO: clean this out (but right now it's good for discussing before I get some sleep).

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

export default syncRouter;