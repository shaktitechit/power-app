import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

import User from "./modals/user.js";
import PresenceLog from "./modals/presenceLog.js";

// fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load .env from backend/.env
dotenv.config({ path: path.join(__dirname, ".env") });

// if your .env is in project root, use this instead:
// dotenv.config({ path: path.join(__dirname, "../.env") });

const seedData = async () => {
  try {
    await connectDB();

    await PresenceLog.deleteMany();
    await User.deleteMany();

    await User.create([
      {
        name: "Puneet Oberoi",
        email: "puneet@spspl.com",
        password: "Admin@2026##",
        role: "admin",
      },
    ]);

    console.log("Data seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding the data:", error);
    process.exit(1);
  }
};

seedData();
