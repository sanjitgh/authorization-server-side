const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = 5000;
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");

app.use(
  cors({
    origin: "http://localhost:5173", // Allow Vite frontend
    credentials: true,
  })
);
// Connect Mongo

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const userCollection = client.db("authorization").collection("users");

    // user signup api
    app.post("/api/signup", async (req, res) => {
      const { userName, password, shopNames } = req.body;

      // Hash the password with 10 salt rounds
      const hashedPassword = await bcrypt.hash(password, 10);

      // Normalize shop names
      const cleanedShops = shopNames.map((shop) => shop.trim().toLowerCase());

      // Check for existing shop names
      const isExist = await userCollection.findOne({
        shopNames: { $in: cleanedShops },
      });

      if (isExist) {
        return res.status(400).send({
          success: false,
          message: "One or more shop names already exist.",
        });
      }

      // Try inserting user
      try {
        const result = await userCollection.insertOne({
          userName,
          password: hashedPassword,
          shopNames: cleanedShops,
        });

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Server error." });
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// view on server UI
app.get("/", (req, res) => {
  res.send("Server is runing");
});

app.listen(port, () => {
  console.log(`Server is runing on port: ${port}`);
});
