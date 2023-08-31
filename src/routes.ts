import { Router } from "./router";

import { Session } from "./concept";
import freet from "./concepts/freet";
import friend from "./concepts/friend";
import user, { User } from "./concepts/user";

export const userRouter = new Router("user", user);
userRouter.get("/", user.readSafe);
userRouter.post("/", user.create);
userRouter.patch("/", user.update);
userRouter.delete("/", user.delete);

export const freetRouter = new Router("freet", freet);
freetRouter.get("/", freet.read);
freetRouter.post("/", freet.create);
freetRouter.patch("/:_id", freet.update);
freetRouter.delete("/:_id", freet.delete);

export const friendRouter = new Router("friend", friend);
friendRouter.get("/friends/:user", friend.getFriends);
friendRouter.delete("/friends/:friend", friend.removeFriend);
friendRouter.get("/requests", friend.getRequests);
friendRouter.delete("/requests/:to", friend.removeRequest);
friendRouter.put("/requests/:from", friend.respondRequest);

export const syncRouter = new Router("sync");
syncRouter.post("/login", login);
syncRouter.post("/logout", logout);
syncRouter.post("/friend/requests", sendRequest);

async function login(credentials: User, session: Session) {
  const u = await user.logIn(credentials, session);
  const f = await freet.create("Hi, I logged in!", session);
  return { msg: "Logged in and freeted!", user: u, freet: f };
}

async function logout(session: Session) {
  const f = await freet.create("Bye bye, logging off!", session);
  const u = user.logOut(session);
  return { msg: "Logged out and freeted!", user: u, freet: f };
}

async function sendRequest(to: string, session: Session) {
  await user.userExists(to);
  return await friend.sendRequest(to, session);
}
