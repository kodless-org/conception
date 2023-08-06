import express from "express";
import logger from "morgan";
import cors from "cors";
import session from 'express-session';

import freet from "./concepts/freet";
import user from "./concepts/user";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(logger("dev"));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(session({
  secret: 'Hello 6.1040',
  resave: true,
  saveUninitialized: false,
}));

declare module 'express-session' {
  export interface SessionData {
    // Keeping this data minimal since it will be sent in every request.
    user: {
      _id: import("mongodb").ObjectId,
      username: string,
    }
  }
}

// Register your concepts!
[freet, user]
.forEach(concept => {
  app.use('/api/' + concept.name, concept.router);
});

app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Page not found'
  });
});

app.listen(PORT, () => {
  console.log("Started listening on port", PORT);
});