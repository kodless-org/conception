import { HttpError, Session } from "./concept";

export class Validators {
  static isLoggedOut(session: Session) {
    if (session.user) {
      throw new HttpError(401, "You need to be logged out!");
    }
  }

  static isLoggedIn(session: Session) {
    if (!session.user) {
      throw new HttpError(401, "You need to be logged in!");
    }
  }
}

export function getParamNames(f: Function) {
  return f
    .toString()
    .match(/\((.*?)\)/)![1]
    .split(",") // Simple regex to get "name: type" items in signature
    .map((param: string) => param.trim()); // remove whitespaces
}
