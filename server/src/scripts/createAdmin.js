import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../lib/database.js";
import User from "../models/User.js";

dotenv.config();

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required in server/.env");
  process.exit(1);
}

try {
  await connectDatabase();

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    existing.name = ADMIN_NAME;
    existing.role = "admin";

    if (ADMIN_PASSWORD) {
      existing.password = ADMIN_PASSWORD;
    }

    await existing.save();
    console.log("Admin account updated");
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin"
    });
    console.log("Admin account created");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
