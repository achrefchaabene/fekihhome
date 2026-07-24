import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory
} from "../controllers/categoryController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", listCategories);
router.post("/", protect, requireAdmin, createCategory);
router.put("/:id", protect, requireAdmin, updateCategory);
router.delete("/:id", protect, requireAdmin, deleteCategory);

export default router;
