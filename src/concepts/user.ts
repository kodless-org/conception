import ConceptDb, { ConceptBase } from "../conceptDb";
import Concept, { HttpError, type Session } from "../concept";
import { Validators } from "../utils";

export interface User extends ConceptBase {
  username: string;
  password: string;
  profilePictureUrl?: string;
}

export class UserActions {
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
      throw new HttpError(403, "Username or password is incorrect.");
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
  static async canCreate(document: User) {
    if (await userDb.readOne({ username: document.username })) {
      throw new HttpError(401, "User with this username already exists!");
    }
  }
}

const userDb = new ConceptDb<User>("user");
const user = new Concept<User>(userDb);

user.defineAction("create", user.utilActions.create, [Validators.loggedOut, UserValidators.canCreate]);
// TODO: user.create(...)
user.defineAction("readSafe", UserActions.readSafe);
user.defineAction("login", UserActions.logIn, [Validators.loggedOut]);
user.defineAction("logout", UserActions.logIn, [Validators.loggedIn]);
user.defineAction("update", UserActions.update, [Validators.loggedIn, UserValidators.canCreate]);
user.defineAction("delete", UserActions.delete, [Validators.loggedIn]);

export default user;