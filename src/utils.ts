import { HttpError, Session } from "./conceptRouter";
import { Request, Response, NextFunction } from "express";

export class Validators {
  static loggedOut(session: Session) {
    if (session.user) {
      throw new HttpError(401, "You need to be logged out!");
    }
  }

  static loggedIn(session: Session) {
    if (!session.user) {
      throw new HttpError(401, "You need to be logged in!");
    }
  }
}