import { Router } from "express";
import {
  createOrder,
  deleteOrder,
  getOrderStats,
  listOrders,
  updateOrderStatus
} from "../controllers/orderController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/", createOrder);
router.get("/", protect, requireAdmin, listOrders);
router.get("/stats", protect, requireAdmin, getOrderStats);
router.patch("/:id/status", protect, requireAdmin, updateOrderStatus);
router.delete("/:id", protect, requireAdmin, deleteOrder);

export default router;
