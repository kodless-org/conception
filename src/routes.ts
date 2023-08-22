import express from "express";
import { ConceptRouter } from "./conceptRouter";
import { makeRoute } from "./utils";

import user, { User } from "./concepts/user";
import freet, { Freet } from "./concepts/freet";
import { Session } from "./concept";

export const userRouter = new ConceptRouter("user");
userRouter.get("/", user.readSafe);
userRouter.post("/", user.create);
userRouter.patch("/", user.update);
userRouter.delete("/", user.delete);

export const freetRouter = new ConceptRouter("freet");
freetRouter.get("/", freet.read);
freetRouter.post("/", freet.create);
freetRouter.patch("/:_id", freet.update);
freetRouter.delete("/:_id", freet.delete);

export const syncRouter = express.Router();
syncRouter.post("/login", makeRoute(login));
syncRouter.post("/logout", makeRoute(logout));

async function login(document: User, session: Session) {
  const u = await user.logIn(document, session);
  const f = await freet.create({ author: session.user?.username, content: "Hi, I logged in!" } as Freet, session);
  return { msg: "Logged in and freeted!", user: u, freet: f };
}

async function logout(document: User, session: Session) {
  const u = user.logOut(session);
  const f = await freet.create({ author: session.user?.username, content: "Bye bye, logging off!" } as Freet, session);
  return { msg: "Logged out and freeted!", user: u, freet: f };
}
