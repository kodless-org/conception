import { ConceptRouter } from "./conceptRouter";

import user from "./concepts/user";
import freet from "./concepts/freet";

export const userRouter = new ConceptRouter(user);
userRouter.get("/", "readSafe");
userRouter.post("/", "create");
userRouter.patch("/", "update");
userRouter.delete("/", "delete");
// userRouter.post("/login", "login");
// userRouter.post("/logout", "logout");


export const freetRouter = new ConceptRouter(freet);
freetRouter.get("/", "read");
freetRouter.post("/", "create");
freetRouter.patch("/:_id", "update");
freetRouter.delete("/:_id", "delete");

