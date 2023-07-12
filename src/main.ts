import express from "express";
import logger from "morgan";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

// Import your concepts, do not forget to register below too.
import freet from "./concepts/freet";

dotenv.config({});
const mongoUri = process.env.MONGO_SRV;
if (!mongoUri) {
  throw new Error("Please add the MongoDB connection SRV as 'MONGO_SRV'");
}

const client = new MongoClient(mongoUri as string, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

(async () => {
  try {
    await client.connect();
  } catch (e) {
    throw new Error("MongoDB Connection failed: " + e);
  }
  await client.db("admin").command({ ping: 1 });
  console.log("You successfully connected to MongoDB!");
})();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(logger("dev"));

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