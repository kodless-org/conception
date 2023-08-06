import { Request, Response, NextFunction } from "express";

export class Validators {
  static loggedOut(req: Request, res: Response, next: NextFunction) {
    if (req.session.user) {
      res.status(401).json({ msg: "You need to be logged out!" });
      return;
    }
    next();
  }

  static loggedIn(req: Request, res: Response, next: NextFunction) {
    if (!req.session.user) {
      res.status(401).json({ msg: "You need to be logged in!" });
      return;
    }
    next();
  }
}