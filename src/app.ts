import express from "express";
import logger from "morgan";
import cors from "cors";

import freet from "./concepts/freet";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(logger("dev"));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Register your concepts!
[freet]
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