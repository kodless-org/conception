import { Filter } from "mongodb";

import { Router } from "./framework/router";

import freetManager, { Freet } from "./concepts/freet";
import sessionManager, { Session } from "./concepts/session";
import userManager, { User } from "./concepts/user";

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
  return await userManager.delete(userId);
});

export const freetRouter = new Router("freet");

freetRouter.get("/", async (query: Filter<Freet>) => {
  return await freetManager.read(query);
});

// freetRouter.post("/", async (session: Session, freet: Freet) => {
//   const userId = sessionManager.getUser(session)._id;
//   return await freetManager.create(freet);
// });
// freetRouter.get("/", freetManager.read);
// freetRouter.post("/", freetManager.create);
// freetRouter.patch("/:_id", freetManager.update);
// freetRouter.delete("/:_id", freetManager.delete);

export const friendRouter = new Router("friend");
// friendRouter.get("/friends/:user", friendManager.getFriends);
// friendRouter.delete("/friends/:friend", friendManager.removeFriend);
// friendRouter.get("/requests", friendManager.getRequests);
// friendRouter.delete("/requests/:to", friendManager.removeRequest);
// friendRouter.put("/requests/:from", friendManager.respondRequest);

export const syncRouter = new Router("sync");
// syncRouter.post("/login", login);
// syncRouter.post("/logout", logout);
// syncRouter.post("/friend/requests", sendRequest);

// async function login(credentials: User, session: Session) {
//   const u = await userManager.logIn(credentials, session);
//   const f = await freetManager.create("Hi, I logged in!", session);
//   return { msg: "Logged in and freeted!", user: u, freet: f };
// }
// // MongoDb transaction

// // magic(f) {
// //   start_transaction();
// //   try {
// //     result = f();
// //   } finally{
// //     end_transaction();
// //   }
// //   return result;
// // }

// async function logout(session: Session) {
//   const f = await freetManager.create("Bye bye, logging off!", session);
//   const u = userManager.logOut(session);
//   return { msg: "Logged out and freeted!", user: u, freet: f };
// }

// async function sendRequest(to: string, session: Session) {
//   await userManager.userExists(to);
//   return await friendManager.sendRequest(to, session);
// }
