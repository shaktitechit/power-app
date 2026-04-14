import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createUtilityAccount,
  getUtilityAccounts,
  getUtilityAccountById,
  submitUtilityAuditStep,
  allowUtilityAuditStep,
  declareAuditStepNoData,
  clearAuditStepNoData,
  updateUtilityAccount,
  deleteUtilityAccount,
} from "../controllers/utilityController.js";
import { uploadDocuments } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router
  .route("/")
  .post(protect, uploadDocuments, createUtilityAccount)
  .get(protect, getUtilityAccounts);

router.post("/:id/audit-step-submit", protect, submitUtilityAuditStep);
router.post("/:id/audit-step-allow", protect, allowUtilityAuditStep);
router.post("/:id/audit-no-data-declare", protect, declareAuditStepNoData);
router.post("/:id/audit-no-data-clear", protect, clearAuditStepNoData);

router
  .route("/:id")
  .get(protect, getUtilityAccountById)
  .put(protect, uploadDocuments, updateUtilityAccount)
  .delete(protect, deleteUtilityAccount);

export default router;
