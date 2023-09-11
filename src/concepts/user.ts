import { ObjectId } from "mongodb";
import Concept from "../framework/concept";
import { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface UserDoc extends BaseDoc {
  username: string;
  password: string;
  profilePictureUrl?: string;
}

export default class UserConcept extends Concept<{ users: UserDoc }> {
  async create(username: string, password: string) {
    await this.canCreate(username, password);
    const _id = (await this.db.users.createOne({ username, password })).insertedId;
    return { msg: "User created successfully!", user: await this.db.users.readOneById(_id) };
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

  async update(_id: ObjectId, update: Partial<UserDoc>) {
    if (update.username !== undefined) {
      await this.isUsernameUnique(update.username);
    }
    await this.db.users.updateOneById(_id, update);
    return { msg: "User updated successfully!" };
  }

  async delete(user: ObjectId) {
    await this.db.users.deleteOneById(user);
    return { msg: "User deleted!" };
  }

  async userExists(_id: ObjectId) {
    const maybeUser = await this.db.users.readOneById(_id);
    if (maybeUser === null) {
      throw new NotFoundError(`User not found!`);
    }
  }

  private async canCreate(username: string, password: string) {
    if (!username || !password) {
      throw new BadValuesError("Username and password must be non-empty!");
    }
    await this.isUsernameUnique(username);
  }

  private async isUsernameUnique(username: string) {
    if (await this.db.users.readOne({ username })) {
      throw new NotAllowedError(`User with username ${username} already exists!`);
    }
  }
}
