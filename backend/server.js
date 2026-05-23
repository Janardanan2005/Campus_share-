import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import authRoutes from "./routes/authRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import requestRoutes from "./routes/requestRoute.js";

dotenv.config();

const requiredEnvVars = ["MONGO_URI"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set. Falling back to an insecure development secret.");
}

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    },
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/api", (req, res) => {
  res.send("CampusShare API running");
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", itemRoutes);
app.use("/api/requests", requestRoutes);

const port = process.env.PORT || 5000;
const allowInMemoryFallback = process.env.ALLOW_IN_MEMORY_FALLBACK !== "false";
let memoryServer;

const connectWithInMemoryFallback = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully!");
    return;
  } catch (error) {
    if (!allowInMemoryFallback) {
      throw error;
    }

    console.warn("Failed to connect to MongoDB Atlas.");
    console.warn(error.message);
    console.warn("Starting an in-memory MongoDB instance for local development.");

    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: "campus_share_dev",
      },
    });

    await mongoose.connect(memoryServer.getUri());
    console.log("In-memory MongoDB started successfully.");
  }
};

const startServer = async () => {
  try {
    await connectWithInMemoryFallback();
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error("Failed to connect to MongoDB.");
    console.error(error.message);
    process.exit(1);
  }
};

const shutdown = async () => {
  await mongoose.connection.close();

  if (memoryServer) {
    await memoryServer.stop();
  }
};

process.on("SIGINT", async () => {
  await shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await shutdown();
  process.exit(0);
});

startServer();
