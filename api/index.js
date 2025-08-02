const express = require("express");
const mongoose = require("mongoose");
const app = express();
const connectDB = require("./db");
const admin = require("./firebase");

connectDB();

app.use(express.json());

const loginRoute = require("./routes/login");
const registerRoute = require("./routes/register");
const home = require("./routes/home");
const payment = require("./routes/payment");
app.use("/auth", loginRoute);
app.use("/auth", registerRoute);
app.use("/home", home);
app.use("/home", payment);

// For testing and checking health status
app.get("/", (req, res) => {
  res.send("Connected to Virtual Library Backend Successfully 👾🥳");
});

app.get("/admin-test", async (req, res) => {
  try {
    const users = await admin.auth().listUsers(1);
    res.json({
      message: "Firebase Admin connected ✅",
      uid: users.users[0]?.uid || "No users found",
    });
  } catch (error) {
    console.error("Firebase Admin test error:", error);
    res
      .status(500)
      .json({ message: "❌ Firebase Admin not working", error: error.message });
  }
});

app.get("/status", (req, res) => {
  const status = mongoose.connection.readyState;
  res.json({
    mongodb: status === 1 ? "connected" : "not connected",
    code: status,
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  `Server started on port ${port}`;
});
