import { SessionData } from "express-session";
import { ObjectId } from "mongodb";
import Concept from "../framework/concept";
import { NotAllowedError, UnauthenticatedError } from "./errors";

export type SessionDoc = SessionData;

// This allows us to overload express session data type.
declare module "express-session" {
  export interface SessionData {
    user?: ObjectId;
  }
}

export default class SessionConcept extends Concept<{}> {
  setUser(session: SessionDoc, user: ObjectId | undefined) {
    session.user = user;
  }

  getUser(session: SessionDoc) {
    this.isLoggedIn(session);
    return session.user!;
  }

  isLoggedIn(session: SessionDoc) {
    if (session.user === undefined) {
      throw new UnauthenticatedError("Not logged in!");
    }
  }

  isLoggedOut(session: SessionDoc) {
    if (session.user !== undefined) {
      throw new NotAllowedError("Must be logged out!");
    }
  }
}
