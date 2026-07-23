import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  listProducts
} from "../controllers/productController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", listProducts);
router.post("/", protect, requireAdmin, upload.single("image"), createProduct);
router.delete("/:id", protect, requireAdmin, deleteProduct);

export default router;
