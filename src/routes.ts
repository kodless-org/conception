import { Filter, ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Friend, Post, User, WebSession } from "./app";
import { BadValuesError } from "./concepts/errors";
import { PostDoc, PostOptions } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
  @Router.get("/users")
  async getUsers(username?: string) {
    return await User.getUsers(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.setUser(session, undefined);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    const u = await User.logIn(username, password);
    WebSession.setUser(session, u._id);
    const f = await Post.create(u._id, "Hi, I logged in!");
    return { msg: "Logged in and posted!", user: u, post: await Responses.post(f.post) };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.isLoggedIn(session);
    const user = WebSession.getUser(session);
    WebSession.setUser(session, undefined);
    const f = await Post.create(user, "Bye bye, logging off!");
    return { msg: "Logged out and posted!", post: await Responses.post(f.post) };
  }

  @Router.get("/posts")
  async getPosts(query: Filter<PostDoc>) {
    return Responses.posts((await Post.read(query)).posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthorMatch(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthorMatch(user, _id);
    return Post.delete(_id);
  }

  @Router.get("/friends/:user")
  async getFriends(user: ObjectId) {
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: ObjectId) {
    const user = WebSession.getUser(session);
    await Friend.removeFriend(user, friend);
  }

  @Router.get("/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.delete("/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: ObjectId) {
    const user = WebSession.getUser(session);
    return await Friend.removeRequest(user, to);
  }

  @Router.put("/requests/:from")
  async respondFriendRequest(session: WebSessionDoc, from: ObjectId, response: string) {
    if (response !== "accept" && response !== "reject") {
      throw new BadValuesError("response needs to be 'accept' or 'reject'");
    }
    const user = WebSession.getUser(session);
    return await Friend.respondRequest(user, from, response);
  }

  @Router.post("/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: ObjectId) {
    await User.userExists(to);
    const user = WebSession.getUser(session);
    return await Friend.sendRequest(user, to);
  }
}

export default getExpressRouter(new Routes());
