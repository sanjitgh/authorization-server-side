const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;

// middlewere
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://shop-auth-840db.web.app",
      ];

      const allowedDomain = ".shop-auth-840db.web.app"; // allow any subdomain

      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(allowedDomain)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Connect MongoDB
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.rwhf0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const userCollection = client.db("authorization").collection("users");

    // user signUp api
    app.post("/api/signup", async (req, res) => {
      const { userName, password, shopNames } = req.body;

      // Hash the password with 10 salt rounds
      const hashedPassword = await bcrypt.hash(password, 10);

      // Normalize shop names
      const cleanedShops = shopNames.map((shop) => shop.trim().toLowerCase());

      // Check for existing shop names
      const isExistShopName = await userCollection.findOne({
        shopNames: { $in: cleanedShops },
      });

      if (isExistShopName) {
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

    // user signIn api with generate jwt session token
    app.post("/api/signin", async (req, res) => {
      const { userName, password, remember } = req.body; // remember is Boolean value

      try {
        const user = await userCollection.findOne({ userName });

        // validate userName
        if (!user) {
          return res.status(400).send({ message: "Invalid user name!" });
        }

        // validate password using bcrypt
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
          return res.status(400).send({ message: "Invalid password!" });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id },
          `${process.env.JWT_SECRET_KEY}`,
          { expiresIn: remember ? "7d" : "50m" }
        );

        // set cookie with appropriate expiretion

        res.cookie("authToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          // domain:
          //   process.env.NODE_ENV === "production"
          //     ? ".domain.com"
          //     : undefined, // sub domain will be availavle when we have custom domain
          maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000,
        });

        const result = await userCollection.findOne({
          userName,
        });
        res
          .status(200)
          .send({ success: true, message: "Login Successfull!", result });
      } catch (error) {
        console.error("Login Error", error);
        res.status(500).send({ message: "Internal server error." });
      }
    });

    // get user info for valid user
    app.get("/api/userinfo", async (req, res) => {
      try {
        const token = req.cookies.authToken;
        if (!token) {
          return res.status(401).send({ message: "Unauthorized Access" });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await userCollection.findOne({
          _id: new ObjectId(decode.userId),
        });

        if (!user) {
          return res.status(404).send({ message: "User Not Found!" });
        }

        res.send({ success: true, user });
      } catch (error) {
        res.status(401).send({ message: "Invalid or expired token!" });
      }
    });

    // user logout api
    app.post("/api/logout", async (req, res) => {
      res.clearCookie("authToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      });
      res.send({ success: true, message: "Logged out Successfully!" });
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
