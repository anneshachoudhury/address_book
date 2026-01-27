// backend/server.js

const express = require("express");
const nodemailer = require("nodemailer");
// const bodyParser = require("body-parser");
const { connectDB, getDB } = require("./db");
const cors = require("cors");
require("dotenv").config();

const app = express();
// app.use(bodyParser.json());
app.use(express.json());

app.use(
  cors({
    origin: '*',
    // origin: [
    //   "http://localhost:3000"
    //   ,"http://192.168.9.135:3000",
    //   "http://192.168.29.102:3000"
    // ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);
app.options(/.*/, cors()); // Regex for all routes

// Log every request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const otpStore = {}; // { email: { email: {otp, expiresAt}, phone: {otp, expiresAt} } }

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp, type) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465, // Use port 465 for SSL
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Do not fail on invalid certificates
      rejectUnauthorized: false
    }
  });

  const subject =
    type === "email"
      ? "Your OTP for Email Verification"
      : "Your OTP for Phone Number Verification";

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text: `Your OTP for ${type} verification is ${otp}. It is valid for 5 minutes.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Email send error:", err);
    throw err;
  }
}

// Request OTP (shared logic)
function requestOtpHandler(type) {
  return async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const now = Date.now();
    otpStore[email] = otpStore[email] || {};

    // Initialize attempt tracking if not exists
    if (!otpStore[email].attempts) {
      otpStore[email].attempts = {};
    }
    if (!otpStore[email].attempts[type]) {
      otpStore[email].attempts[type] = {
        count: 0,
        lastAttempt: 0,
        lockoutUntil: 0,
      };
    }

    const attemptData = otpStore[email].attempts[type];
    const record = otpStore[email][type];

    // Check if user is in lockout period
    if (attemptData.lockoutUntil > now) {
      const secondsLeft = Math.ceil((attemptData.lockoutUntil - now) / 1000);
      return res.status(429).json({ error: `Try again in ${secondsLeft}s` });
    }

    // Check if 20-second cooldown is active (for attempts 1 and 2)
    if (attemptData.count < 3 && attemptData.lastAttempt > now - 20000) {
      const secondsLeft = Math.ceil(
        (attemptData.lastAttempt + 20000 - now) / 1000
      );
      return res
        .status(429)
        .json({ error: `Wait ${secondsLeft}s before resending` });
    }

    // Reset attempt count if last attempt was more than 5 minutes ago
    if (attemptData.lastAttempt < now - 300000) {
      attemptData.count = 0;
      attemptData.lockoutUntil = 0;
    }

    // Increment attempt count
    attemptData.count++;
    attemptData.lastAttempt = now;

    // Apply 5-minute lockout after 3 attempts
    if (attemptData.count >= 3) {
      attemptData.lockoutUntil = now + 300000; // 5 minutes
    }

    const otp = generateOTP();
    otpStore[email][type] = {
      otp,
      expiresAt: now + 5 * 60 * 1000, // 5 min OTP validity
    };

    try {
      await sendOTPEmail(email, otp, type);
      res.json({
        message: `OTP for ${type} sent successfully`,
        attempts: attemptData.count,
        lockout: attemptData.count >= 3,
      });
    } catch (err) {
      console.error("Failed to send OTP:", err);
      res.status(500).json({ error: "Failed to send OTP: " + err.message });
    }
  };
}

// Verify OTP (shared logic)
function verifyOtpHandler(type) {
  return (req, res) => {
    const { email, otp } = req.body;
    const userOtps = otpStore[email];
    if (!userOtps || !userOtps[type]) {
      return res.status(400).json({ error: `No ${type} OTP requested` });
    }

    const record = userOtps[type];
    if (record.expiresAt < Date.now()) {
      return res.status(400).json({ error: "OTP expired" });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    delete otpStore[email][type]; // OTP used
    res.json({ message: `${type} verified successfully` });
  };
}

// Routes
app.post("/request-email-otp", requestOtpHandler("email"));
app.post("/verify-email-otp", verifyOtpHandler("email"));
app.post("/request-phone-otp", requestOtpHandler("phone"));
app.post("/verify-phone-otp", verifyOtpHandler("phone"));

// Database connection test
app.get("/test-db", async (req, res) => {
  try {
    const db = getDB();
    const collections = await db.listCollections().toArray();
    const contactCount = await db.collection("contacts").countDocuments();

    res.json({
      database: db.databaseName,
      collections: collections.map((c) => c.name),
      contactCount: contactCount,
      status: "Database connected successfully",
    });
  } catch (err) {
    console.error("Database test failed:", err);
    res.status(500).json({ error: "Database test failed: " + err.message });
  }
});

app.get("/debug-contacts", async (req, res) => {
  try {
    const db = getDB();
    const contacts = await db.collection("contacts").find({}).toArray();

    const contactsWithTypes = contacts.map((contact) => ({
      _id: contact._id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
      phoneVerified: {
        value: contact.phoneVerified,
        type: typeof contact.phoneVerified,
      },
      emailVerified: {
        value: contact.emailVerified,
        type: typeof contact.emailVerified,
      },
    }));

    res.json(contactsWithTypes);
  } catch (err) {
    console.error("Error checking contacts:", err);
    res.status(500).json({ error: err.message });
  }
});

// route to save contacts in db
app.post("/contacts", async (req, res) => {
  console.log("POST /contacts hit");
  console.log("Request body:", req.body);

  try {
    const db = getDB();
    console.log("Database name:", db.databaseName);

    const contact = req.body;

    // Add validation
    if (!contact.name || !contact.email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const result = await db.collection("contacts").insertOne(contact);
    console.log("Insert result:", result);

    res.status(201).json({
      message: "Contact added to MongoDB",
      insertedId: result.insertedId,
    });
  } catch (err) {
    console.error("Failed to save contact:", err);
    res.status(500).json({ error: "Failed to save contact: " + err.message });
  }
});

// Reverse geocode proxy route
app.get("/api/reverse-geocode", async (req, res) => {
  const { lat, lon } = req.query;
  console.log("Reverse geocode request:", { lat, lon });

  try {
    // Use the standard JSON format instead of jsonv2 for better compatibility
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          "User-Agent": "MyContactApp/1.0 (your-email@example.com)", // Use a real email
          "Accept-Language": "en",
        },
      }
    );

    console.log("Nominatim response status:", response.status);

    if (!response.ok) {
      throw new Error(
        `Nominatim API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Geocoding successful");

    res.json(data);
  } catch (err) {
    console.error("Reverse geocode error:", err);
    res.status(500).json({
      error: "Failed to fetch reverse geocode",
      details: err.message,
    });
  }
});

connectDB().then(() => {
  app.listen(5000, "0.0.0.0", () => console.log("Server running on port 5000"));
});



















// // backend/server.js

// const express = require("express");
// const nodemailer = require("nodemailer");
// // const bodyParser = require("body-parser");
// const { connectDB, getDB } = require("./db");
// const cors = require("cors");
// require("dotenv").config();

// const app = express();
// // app.use(bodyParser.json());
// app.use(express.json());

// app.use(
//   cors({
//     origin: '*',
//     // origin: [
//     //   "http://localhost:3000"
//     //   ,"http://192.168.9.135:3000",
//     //   "http://192.168.29.102:3000"
//     // ],
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type"],
//     credentials: true,
//   })
// );
// app.options(/.*/, cors()); // Regex for all routes

// // Log every request
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// const otpStore = {}; // { email: { email: {otp, expiresAt}, phone: {otp, expiresAt} } }

// // Generate 6-digit OTP
// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// // Send OTP email
// async function sendOTPEmail(email, otp, type) {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   const subject =
//     type === "email"
//       ? "Your OTP for Email Verification"
//       : "Your OTP for Phone Number Verification";

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject,
//     text: `Your OTP for ${type} verification is ${otp}. It is valid for 5 minutes.`,
//   };

//   return transporter.sendMail(mailOptions);
// }

// // Request OTP (shared logic)
// // Request OTP (shared logic)
// function requestOtpHandler(type) {
//   return async (req, res) => {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ error: "Email required" });

//     const now = Date.now();
//     otpStore[email] = otpStore[email] || {};

//     // Initialize attempt tracking if not exists
//     if (!otpStore[email].attempts) {
//       otpStore[email].attempts = {};
//     }
//     if (!otpStore[email].attempts[type]) {
//       otpStore[email].attempts[type] = {
//         count: 0,
//         lastAttempt: 0,
//         lockoutUntil: 0,
//       };
//     }

//     const attemptData = otpStore[email].attempts[type];
//     const record = otpStore[email][type];

//     // Check if user is in lockout period
//     if (attemptData.lockoutUntil > now) {
//       const secondsLeft = Math.ceil((attemptData.lockoutUntil - now) / 1000);
//       return res.status(429).json({ error: `Try again in ${secondsLeft}s` });
//     }

//     // Check if 20-second cooldown is active (for attempts 1 and 2)
//     if (attemptData.count < 3 && attemptData.lastAttempt > now - 20000) {
//       const secondsLeft = Math.ceil(
//         (attemptData.lastAttempt + 20000 - now) / 1000
//       );
//       return res
//         .status(429)
//         .json({ error: `Wait ${secondsLeft}s before resending` });
//     }

//     // Reset attempt count if last attempt was more than 5 minutes ago
//     if (attemptData.lastAttempt < now - 300000) {
//       attemptData.count = 0;
//       attemptData.lockoutUntil = 0;
//     }

//     // Increment attempt count
//     attemptData.count++;
//     attemptData.lastAttempt = now;

//     // Apply 5-minute lockout after 3 attempts
//     if (attemptData.count >= 3) {
//       attemptData.lockoutUntil = now + 300000; // 5 minutes
//     }

//     const otp = generateOTP();
//     otpStore[email][type] = {
//       otp,
//       expiresAt: now + 5 * 60 * 1000, // 5 min OTP validity
//     };

//     try {
//       await sendOTPEmail(email, otp, type);
//       res.json({
//         message: `OTP for ${type} sent successfully`,
//         attempts: attemptData.count,
//         lockout: attemptData.count >= 3,
//       });
//     } catch (err) {
//       console.error("Failed to send OTP:", err);
//       res.status(500).json({ error: "Failed to send OTP" });
//     }
//   };
// }

// // Verify OTP (shared logic)
// function verifyOtpHandler(type) {
//   return (req, res) => {
//     const { email, otp } = req.body;
//     const userOtps = otpStore[email];
//     if (!userOtps || !userOtps[type]) {
//       return res.status(400).json({ error: `No ${type} OTP requested` });
//     }

//     const record = userOtps[type];
//     if (record.expiresAt < Date.now()) {
//       return res.status(400).json({ error: "OTP expired" });
//     }
//     if (record.otp !== otp) {
//       return res.status(400).json({ error: "Invalid OTP" });
//     }

//     delete otpStore[email][type]; // OTP used
//     res.json({ message: `${type} verified successfully` });
//   };
// }

// // Routes
// app.post("/request-email-otp", requestOtpHandler("email"));
// app.post("/verify-email-otp", verifyOtpHandler("email"));
// app.post("/request-phone-otp", requestOtpHandler("phone"));
// app.post("/verify-phone-otp", verifyOtpHandler("phone"));

// // Database connection test
// app.get("/test-db", async (req, res) => {
//   try {
//     const db = getDB();
//     const collections = await db.listCollections().toArray();
//     const contactCount = await db.collection("contacts").countDocuments();

//     res.json({
//       database: db.databaseName,
//       collections: collections.map((c) => c.name),
//       contactCount: contactCount,
//       status: "Database connected successfully",
//     });
//   } catch (err) {
//     console.error("Database test failed:", err);
//     res.status(500).json({ error: "Database test failed: " + err.message });
//   }
// });

// app.get("/debug-contacts", async (req, res) => {
//   try {
//     const db = getDB();
//     const contacts = await db.collection("contacts").find({}).toArray();

//     const contactsWithTypes = contacts.map((contact) => ({
//       _id: contact._id,
//       name: contact.name,
//       phone: contact.phone,
//       email: contact.email,
//       address: contact.address,
//       phoneVerified: {
//         value: contact.phoneVerified,
//         type: typeof contact.phoneVerified,
//       },
//       emailVerified: {
//         value: contact.emailVerified,
//         type: typeof contact.emailVerified,
//       },
//     }));

//     res.json(contactsWithTypes);
//   } catch (err) {
//     console.error("Error checking contacts:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // route to save contacts in db
// app.post("/contacts", async (req, res) => {
//   console.log("POST /contacts hit");
//   console.log("Request body:", req.body);

//   try {
//     const db = getDB();
//     console.log("Database name:", db.databaseName);

//     const contact = req.body;

//     // Add validation
//     if (!contact.name || !contact.email) {
//       return res.status(400).json({ error: "Name and email are required" });
//     }

//     const result = await db.collection("contacts").insertOne(contact);
//     console.log("Insert result:", result);

//     res.status(201).json({
//       message: "Contact added to MongoDB",
//       insertedId: result.insertedId,
//     });
//   } catch (err) {
//     console.error("Failed to save contact:", err);
//     res.status(500).json({ error: "Failed to save contact: " + err.message });
//   }
// });

// // Reverse geocode proxy route
// app.get("/api/reverse-geocode", async (req, res) => {
//   const { lat, lon } = req.query;
//   console.log("Reverse geocode request:", { lat, lon });

//   try {
//     // Use the standard JSON format instead of jsonv2 for better compatibility
//     const response = await fetch(
//       `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
//       {
//         headers: {
//           "User-Agent": "MyContactApp/1.0 (your-email@example.com)", // Use a real email
//           "Accept-Language": "en",
//         },
//       }
//     );

//     console.log("Nominatim response status:", response.status);

//     if (!response.ok) {
//       throw new Error(
//         `Nominatim API error: ${response.status} ${response.statusText}`
//       );
//     }

//     const data = await response.json();
//     console.log("Geocoding successful");

//     res.json(data);
//   } catch (err) {
//     console.error("Reverse geocode error:", err);
//     res.status(500).json({
//       error: "Failed to fetch reverse geocode",
//       details: err.message,
//     });
//   }
// });

// connectDB().then(() => {
//   app.listen(5000, "0.0.0.0", () => console.log("Server running on port 5000"));
// });
