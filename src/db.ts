import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

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
  },
});

export async function connect() {
  try {
    await client.connect();
  } catch (e) {
    throw new Error("MongoDB Connection failed: " + e);
  }
  await client.db("admin").command({ ping: 1 });
  console.log("You successfully connected to MongoDB!");
}

// connect() is called in app.ts
const db = client.db("conception-db"); // Feel free to change db name!
export default db;
