import Concept, { HttpError, Session } from "../concept";
import ConceptDb, { ConceptBase } from "../conceptDb";
import { Validators } from "../utils";

export interface User extends ConceptBase {
  username: string;
  password: string;
  profilePictureUrl?: string;
}

class UserConcept extends Concept<{ users: User }> {
  async create(user: User, session: Session) {
    Validators.isLoggedOut(session);
    await this.canCreate(user);

    const _id = (await this.db.users.createOne(user)).insertedId;
    return { user: { ...user, _id } };
  }

  async readSafe(username?: string) {
    const users = (await this.db.users.readMany(username ? { username } : {})).map((user) => {
      // eslint-disable-next-line
      const { password, ...rest } = user; // remove password
      return rest;
    });
    return { users: users };
  }

  async logIn(user: User, session: Session) {
    Validators.isLoggedOut(session);

    const user_ = await this.db.users.readOne({
      username: user.username,
      password: user.password,
    });
    if (!user_) {
      throw new HttpError(403, "Username or password is incorrect.");
    }
    session.user = { _id: user_._id, username: user_.username };
    return { msg: "Successfully logged in." };
  }

  logOut(session: Session) {
    Validators.isLoggedIn(session);
    session.user = undefined;
    return { msg: "Successfully logged out." };
  }

  async update(user: Partial<User>, session: Session) {
    Validators.isLoggedIn(session);
    await this.isUserGood(user);
    await this.db.users.updateOneById(session.user!._id, user);
    return { msg: "Updated user successfully!" };
  }

  async delete(session: Session) {
    Validators.isLoggedIn(session);
    await this.db.users.deleteOneById(session.user!._id);
    session.user = undefined; // log out
    return { msg: "You deleted your account" };
  }

  async userExists(username: string) {
    const maybeUser = await this.db.users.readOne({ username });
    if (maybeUser !== null) {
      throw new HttpError(404, `User ${username} not found!`);
    }
  }

  private async canCreate(user: User) {
    if (!user.username || !user.password) {
      throw new HttpError(400, "Username and password must be non-empty!");
    }
    await this.isUserGood(user);
  }

  private async isUserGood(user: Partial<User>) {
    // TODO: name better
    if (user.username && (await this.db.users.readOne({ username: user.username }))) {
      throw new HttpError(401, "User with this username already exists!");
    }
  }
}

const user = new UserConcept({ users: new ConceptDb<User>("users") });

export default user;
