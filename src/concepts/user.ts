import { Filter, ObjectId } from "mongodb";
import ConceptDb, { ConceptBase } from "../conceptDb";
import ConceptRouter, { ActionOptions } from "../conceptRouter";
import { NextFunction, Request, Response } from "express";
import { Validators } from "../utils";

interface User extends ConceptBase {
  username: string;
  password: string;
  profilePictureUrl?: string;
}

class UserActions {
  static async readSafe(req: Request, res: Response) {
    const filter = req.query.filter as Filter<User>;
    if (filter?.password) {
      res.status(403).json({msg: "Filtering users with password? Not on my watch!"});
    }
    const users = (await userDb.readMany(filter)).map(user => {
      const {password, ...rest} = user;
      return rest;
    });
    res.json({ documents: users });
  }

  static async logIn(req: Request, res: Response) {
    const userReq = req.body.document as User;
    const user = await userDb.readOne({username: userReq.username, password: userReq.password}); 
    if (!user) {
      res.status(401).json({msg: "Username or password is incorrect."});
      return;
    }
    req.session.user = {_id: user._id, username: user.username};
    res.json({msg: "Successfully logged in."});
  }

  static logOut(req: Request, res: Response) {
    req.session.user = undefined;
  }

  static async update(req: Request, res: Response) {
    const update = req.body.document as Partial<User>;
    await userDb.updateOneById(req.session.user!._id, update);
    res.json({msg: "Updated user successfully!"});
  }

  static async delete(req: Request, res: Response) {
    await userDb.deleteOneById(req.session.user!._id);
    req.session.user = undefined; // log out
    res.json({msg: "You deleted your account"});
  }
}

class UserValidators {
  static async canCreate(req: Request, res: Response, next: NextFunction) {
    const user = req.body.document as User;
    if (await userDb.readOne({username: user.username})) {
      res.status(401).json({msg: "User with this username already exists!"});
      return;
    }
    next();
  }
}

const userDb = new ConceptDb<User>("user");
const user = new ConceptRouter<User>(userDb);

user.defineCreateAction({ 'validate': [Validators.loggedOut, UserValidators.canCreate] });
user.defineAction("readSafe", UserActions.readSafe);
user.defineAction("login", UserActions.logIn, {'validate': [Validators.loggedOut]});
user.defineAction("logout", UserActions.logIn, {'validate': [Validators.loggedIn]});
user.defineAction("update", UserActions.update, {'validate': [Validators.loggedIn, UserValidators.canCreate]});
user.defineAction("delete", UserActions.delete, {'validate': [Validators.loggedIn]});

user.router.get("/", ...user.handlers("readSafe"));
user.router.post("/", ...user.handlers("create"));
user.router.patch("/", ...user.handlers("update"));
user.router.delete("/", ...user.handlers("delete"));
user.router.post("/login", ...user.handlers("login"));
user.router.post("/logout", ...user.handlers("logout"));

export default user;