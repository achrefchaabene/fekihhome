import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../lib/database.js";
import { ensureAdminAccount } from "../lib/ensureAdmin.js";

dotenv.config();

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required in server/.env");
  process.exit(1);
}

try {
  await connectDatabase();
  await ensureAdminAccount();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
