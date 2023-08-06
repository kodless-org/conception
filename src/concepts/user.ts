import ConceptDb, { ConceptBase } from "../conceptDb";
import ConceptRouter, {type Session} from "../conceptRouter";
import { NextFunction, Request, Response } from "express";
import { Validators } from "../utils";
  
interface User extends ConceptBase {
  username: string;
  password: string;
  profilePictureUrl?: string;
}

class UserActions {
  static async readSafe(username?: string) {
    const users = (await userDb.readMany(username ? { username } : {})).map(user => {
      const { password, ...rest } = user; // remove password
      return rest;
    });
    return { documents: users };
  }

  static async logIn(document: User, session: Session) {
    const user = await userDb.readOne({ username: document.username, password: document.password });
    if (!user) {
      return { msg: "Username or password is incorrect." };
    }
    session.user = { _id: user._id, username: user.username };
    return { msg: "Successfully logged in." };
  }

  static logOut(session: Session) {
    session.user = undefined;
    return { msg: "Successfully logged out." };
  }

  static async update(document: Partial<User>, session: Session) {
    await userDb.updateOneById(session.user!._id, document);
    return { msg: "Updated user successfully!" };
  }

  static async delete(session: Session) {
    await userDb.deleteOneById(session.user!._id);
    session.user = undefined; // log out
    return { msg: "You deleted your account" };
  }
}

class UserValidators {
  static async canCreate(req: Request, res: Response, next: NextFunction) {
    const user = req.body.document as User;
    if (await userDb.readOne({ username: user.username })) {
      res.status(401).json({ msg: "User with this username already exists!" });
      return;
    }
    next();
  }
}

const userDb = new ConceptDb<User>("user");
const user = new ConceptRouter<User>(userDb);

user.defineCreateAction({ 'validate': [Validators.loggedOut, UserValidators.canCreate] });
user.defineAction("readSafe", UserActions.readSafe);
user.defineAction("login", UserActions.logIn, { 'validate': [Validators.loggedOut] });
user.defineAction("logout", UserActions.logIn, { 'validate': [Validators.loggedIn] });
user.defineAction("update", UserActions.update, { 'validate': [Validators.loggedIn, UserValidators.canCreate] });
user.defineAction("delete", UserActions.delete, { 'validate': [Validators.loggedIn] });

user.router.get("/", ...user.handlers("readSafe"));
user.router.post("/", ...user.handlers("create"));
user.router.patch("/", ...user.handlers("update"));
user.router.delete("/", ...user.handlers("delete"));
user.router.post("/login", ...user.handlers("login"));
user.router.post("/logout", ...user.handlers("logout"));

export default user;