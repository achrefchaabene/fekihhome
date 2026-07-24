import dotenv from "dotenv";
import app from "./server.js";
import { connectDatabase } from "./lib/database.js";
import { ensureAdminAccount } from "./lib/ensureAdmin.js";

dotenv.config();

const port = process.env.PORT || 4000;

connectDatabase()
  .then(async () => {
    await ensureAdminAccount();
    app.listen(port, () => {
      console.log(`Fekih Home API running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed", error);
    process.exit(1);
  });
