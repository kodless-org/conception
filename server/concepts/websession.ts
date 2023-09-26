import { SessionData } from "express-session";
import { ObjectId } from "mongodb";
import { NotAllowedError, UnauthenticatedError } from "./errors";

export type WebSessionDoc = SessionData;

// This allows us to overload express session data type.
declare module "express-session" {
  export interface SessionData {
    user?: ObjectId;
  }
}

export default class WebSessionConcept {
  start(session: WebSessionDoc, user?: ObjectId) {
    this.isLoggedOut(session);
    session.user = user;
  }

  end(session: WebSessionDoc) {
    this.isLoggedIn(session);
    session.user = undefined;
  }

  getUser(session: WebSessionDoc) {
    this.isLoggedIn(session);
    return session.user!;
  }

  isLoggedIn(session: WebSessionDoc) {
    if (session.user === undefined) {
      throw new UnauthenticatedError("Not logged in!");
    }
  }

  isLoggedOut(session: WebSessionDoc) {
    if (session.user !== undefined) {
      throw new NotAllowedError("Must be logged out!");
    }
  }
}
