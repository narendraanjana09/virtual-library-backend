const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./db");
const admin = require("./firebase");

const app = express();
connectDB();

function allowChromeExtensionsAndNative(origin, callback) {
  if (!origin) return callback(null, true);

  if (typeof origin === "string" && origin.startsWith("chrome-extension://")) {
    return callback(null, true);
  }
  return callback(new Error("Not allowed by CORS"), false);
}

app.use(
  cors({
    origin: allowChromeExtensionsAndNative,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // keep if you need cookies; otherwise set false
  })
);

app.use(express.json());

const loginRoute = require("./routes/login");
const registerRoute = require("./routes/register");
const home = require("./routes/home");
const payment = require("./routes/payment");
app.use("/auth", loginRoute);
app.use("/auth", registerRoute);
app.use("/home", home);
app.use("/home", payment);

const ExtensionDay = require("./models/ExtensionDay");

// For testing and checking health status
app.get("/", (req, res) => {
  res.send("Connected to Virtual Library Backend Successfully 👾🥳");
});

app.post("/extension-data", async (req, res) => {
  try {
    const payload = req.body || {};

    // Accept payload.date if provided, otherwise compute server-side UTC date
    let date = payload.date;
    if (!date) {
      const d = new Date();
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      date = `${yyyy}-${mm}-${dd}`;
    }

    const meetingId = payload.meetingId || "";
    const tickAt = payload.tickAt || Math.floor(Date.now() / 1000);
    const usersObj = payload.users || {}; // expect { userId: { ... } } or array?

    // If client sends users as array, convert to map keyed by userId
    let usersMap = {};
    if (Array.isArray(usersObj)) {
      for (const u of usersObj) {
        if (!u || !u.userId) continue;
        usersMap[u.userId] = u;
      }
    } else {
      usersMap = usersObj;
    }

    const filter = { date };
    const update = {
      $set: {
        tickAt,
        users: usersMap,
      },
    };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

    const doc = await ExtensionDay.findOneAndUpdate(filter, update, opts);

    console.log(
      `Extension data saved for date=${date} meeting=${meetingId} users=${
        Object.keys(usersMap).length
      }`
    );

    res.json({
      message: "Extension day data saved",
      date,
      meetingId,
      id: doc._id,
    });
  } catch (err) {
    console.error("Error saving extension-day data:", err);
    res
      .status(500)
      .json({ error: "Error saving extension-day data", details: err.message });
  }
});

app.get("/extension-data/:date", async (req, res) => {
  try {
    const { date } = req.params;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ error: "Invalid or missing date (use YYYY-MM-DD)" });
    }

    const doc = await ExtensionDay.findOne({ date }).lean();

    if (!doc) {
      return res
        .status(404)
        .json({ message: "No data found for this date", date });
    }

    // convert users map/object to array with only required fields
    const usersObj = doc.users || {};
    const usersArray = Object.keys(usersObj).map((k) => {
      const u = usersObj[k] || usersObj.get?.(k) || {};
      return {
        userId: u.userId || k,
        name: u.name || null,
        imgUrl: u.imgUrl || null,
        totalSeconds: Number(u.totalSeconds || 0),
        present: !!u.present,
        firstSeen: u.firstSeen || null,
        lastSeen: u.lastSeen || null,
        joinCount: Number(u.joinCount || 0),
      };
    });

    // optionally sort by totalSeconds descending
    usersArray.sort((a, b) => b.totalSeconds - a.totalSeconds);

    return res.json({
      message: "Extension day data fetched successfully",
      date: doc.date,
      totalUsers: usersArray.length,
      meetingId: doc.meetingId || null,
      tickAt: doc.tickAt || null,
      createdAt: doc.createdAt || null,
      updatedAt: doc.updatedAt || null,
      users: usersArray,
    });
  } catch (err) {
    console.error("Error fetching extension-day data:", err);
    return res.status(500).json({
      error: "Error fetching extension-day data",
      details: err.message,
    });
  }
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
