const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = 5000;
const app = express();
const bcrypt = require("bcrypt");

// middlewere
app.use(express.json());
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

    // user signjUp api
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

      // Check for existing user names
      const isUserExist = await userCollection.findOne({ userName });

      if (isUserExist) {
        return res.status(400).send({
          success: false,
          message: "Username is already taken.",
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

    // user signIn api
    app.post("/api/signin", async (req, res) => {
      const { userName, password, remember } = req.body; // remember is Boolean value

      try {
        const isExistUserName = await userCollection.findOne({ userName });

        // validate userName
        if (!isExistUserName) {
          return res.status(400).send({ message: "Invalid user name!" });
        }

        // validate password using bcrypt
        const isPasswordMatch = await bcrypt.compare(
          password,
          isExistUserName.password
        );

        if (!isPasswordMatch) {
          return res.status(400).send({ message: "Invalid password!" });
        }

        const result = await userCollection.findOne({
          userName,
        });
        res.status(200).send({ success: true, result });
      } catch (error) {
        console.error("Login Error", error);
        res.status(500).send({ message: "Internal server error." });
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
