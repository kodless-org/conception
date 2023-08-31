import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import logger from "morgan";

// The following line sets up the environment variables before everything else.
dotenv.config();

import { connect } from "./db";

// Import your concept routers here.
import { freetRouter, friendRouter, syncRouter, userRouter } from "./routes";

export const app = express();
const PORT = process.env.PORT || 3000;
app.use(logger("dev"));

app.use(cors()); // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

app.use(express.json()); // Enable parsing JSON in requests and responses.
app.use(express.urlencoded({ extended: false })); // Also enable URL encoded request and responses.

// Session allows us to store a cookie 🍪.
app.use(
  session({
    secret: "Hello 6.1040",
    resave: true,
    saveUninitialized: false,
  }),
);

// This allows us to overload express session data type.
declare module "express-session" {
  export interface SessionData {
    // Keeping this data minimal since it will be sent in every request.
    user: {
      _id: string;
      username: string;
    };
  }
}

// Register your concept routers here.
[userRouter, freetRouter, friendRouter].forEach((router) => app.use("/api/" + router.name, router.router));
app.use("/api", syncRouter.router);

// For all unrecognized requests, return a not found message.
app.all("*", (req, res) => {
  res.status(404).json({
    msg: "Page not found",
  });
});

void connect().then(() => {
  app.listen(PORT, () => {
    console.log("Started listening on port", PORT);
  });
});
