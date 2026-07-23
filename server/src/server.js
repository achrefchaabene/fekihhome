import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "fekihhome-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use(errorHandler);

export default app;
