import express from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../../controllers/safety-audit/safetyPacVentilationAuditController.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { uploadDocuments } from "../../middlewares/uploadMiddleware.js";

const router = express.Router();

router.route("/").post(protect, uploadDocuments, create).get(protect, getAll);

router
  .route("/:id")
  .get(protect, getById)
  .put(protect, uploadDocuments, update)
  .delete(protect, remove);

export default router;
