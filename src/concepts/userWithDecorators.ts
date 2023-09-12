import { Filter, ObjectId } from "mongodb";
import ConceptDb, { ConceptBase } from "../conceptDb";
import ConceptRouter, { ActionOptions } from "../conceptRouter";
import { NextFunction, Request, Response } from "express";
import { Validators } from "../utils";
import { route } from "decorators";
import { action } from "decorators";

interface User extends ConceptBase {
  username: string;
  password: string;
  profilePictureUrl?: string;
}


@route("get", "/", "readSafe")
@route("post", "/", "create")
@route("patch", "/", "update")
@route("delete", "/", "delete")
@route("post", "/login", "login")
@route("post", "/logout", "logout")
class UserRouter extends ConceptRouter<User>{

  @action("readSafe")
  public async readSafe(req: Request, res: Response) {
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

  @action("logIn", {'validate': [Validators.loggedOut]})
  public async logIn(req: Request, res: Response) {
    const userReq = req.body.document as User;
    const user = await userDb.readOne({username: userReq.username, password: userReq.password}); 
    if (!user) {
      res.status(401).json({msg: "Username or password is incorrect."});
      return;
    }
    req.session.userId = user._id;
    res.json({msg: "Successfully logged in."});
  }

  @action("logOut", {'validate': [Validators.loggedIn]})
  public logOut(req: Request, res: Response) {
    req.session.userId = undefined;
  }
  
  @action("update", {'validate': [Validators.loggedIn, UserRouter.canCreate]})
  public async update(req: Request, res: Response) {
    const update = req.body.document as Partial<User>;
    await userDb.updateOneById(req.session.userId!, update);
    res.json({msg: "Updated user successfully!"});
  }

  @action("delete", {'validate': [Validators.loggedIn]})
  public async delete(req: Request, res: Response) {
    await userDb.deleteOneById(req.session.userId!);
    req.session.userId = undefined; // log out
    res.json({msg: "You deleted your account"});
  }


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
const user = new UserRouter(userDb);

//This can also be made into a class decorator
user.defineCreateAction({ 'validate': [Validators.loggedOut, UserValidators.canCreate] });


export default user;