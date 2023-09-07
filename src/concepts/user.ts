import Concept from "../framework/concept";
import ConceptDb, { CollectionBase } from "../framework/conceptDb";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface User extends CollectionBase {
  username: string;
  password: string;
  profilePictureUrl?: string;
}

class UserConcept extends Concept<{ users: User }> {
  async create(user: User) {
    await this.canCreate(user);

    const _id = (await this.db.users.createOne(user)).insertedId;
    return { user: { ...user, _id } };
  }

  async getUsers(username?: string) {
    const users = (await this.db.users.readMany(username ? { username } : {})).map((user) => {
      // eslint-disable-next-line
      const { password, ...rest } = user; // remove password
      return rest;
    });
    return { users: users };
  }

  async logIn(username: string, password: string) {
    const user = await this.db.users.readOne({ username, password });
    if (!user) {
      throw new NotAllowedError("Username or password is incorrect.");
    }
    return { msg: "Successfully logged in.", _id: user._id };
  }

  logOut() {
    return { msg: "Successfully logged out." };
  }

  async update(_id: string, update: Partial<User>) {
    if (update.username !== undefined) {
      await this.isUsernameUnique(update.username);
    }
    await this.db.users.updateOneById(_id, update);
    return { msg: "User updated successfully!" };
  }

  async delete(_id: string) {
    await this.db.users.deleteOneById(_id);
    return { msg: "User deleted!" };
  }

  async userExists(_id: string) {
    const maybeUser = await this.db.users.readOneById(_id);
    if (maybeUser === null) {
      throw new NotFoundError(`User not found!`);
    }
  }

  private async canCreate(user: User) {
    if (!user.username || !user.password) {
      throw new BadValuesError("Username and password must be non-empty!");
    }
    await this.isUsernameUnique(user.username);
  }

  private async isUsernameUnique(username: string) {
    if (await this.db.users.readOne({ username })) {
      throw new NotAllowedError(`User with username ${username} already exists!`);
    }
  }
}

const userManager = new UserConcept({ users: new ConceptDb<User>("users") });

export default userManager;
