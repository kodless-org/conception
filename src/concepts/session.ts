import { SessionData } from "express-session";
import { ObjectId } from "mongodb";
import Concept from "../framework/concept";
import { NotAllowedError, UnauthenticatedError } from "./errors";

export type Session = Partial<SessionData>;

// This allows us to overload express session data type.
declare module "express-session" {
  export interface SessionData {
    user: ObjectId;
  }
}

class SessionConcept extends Concept<{}> {
  setUser(session: Session, user: ObjectId | undefined) {
    session.user = user;
  }

  getUser(session: Session) {
    this.isLoggedIn(session);
    return session.user!;
  }

  isLoggedIn(session: Session) {
    if (session.user === undefined) {
      throw new UnauthenticatedError("Not logged in!");
    }
  }

  isLoggedOut(session: Session) {
    if (session.user !== undefined) {
      throw new NotAllowedError("Must be logged out!");
    }
  }
}

const sessionManager = new SessionConcept({});
export default sessionManager;
