import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  getFollowUps,
  createFollowUp,
  getFollowUpById,
  updateFollowUp,
  deleteFollowUp,
  getQuotations,
  getPendingQuotationsForApproval,
  createQuotation,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
} from "../controllers/enquiryController.js";
import { createFacilityFromEnquiry } from "../controllers/facilityController.js";
import { uploadDocuments } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.route("/").post(protect, createEnquiry).get(protect, getEnquiries);

router.get("/pending-quotations", protect, getPendingQuotationsForApproval);

router.post(
  "/:enquiryId/facility",
  protect,
  uploadDocuments,
  createFacilityFromEnquiry,
);

router
  .route("/:enquiryId/follow-ups")
  .get(protect, getFollowUps)
  .post(protect, createFollowUp);

router
  .route("/:enquiryId/follow-ups/:followUpId")
  .get(protect, getFollowUpById)
  .put(protect, updateFollowUp)
  .delete(protect, deleteFollowUp);

router
  .route("/:enquiryId/quotations")
  .get(protect, getQuotations)
  .post(protect, createQuotation);

router
  .route("/:enquiryId/quotations/:quotationId")
  .get(protect, getQuotationById)
  .put(protect, updateQuotation)
  .delete(protect, deleteQuotation);

router
  .route("/:id")
  .get(protect, getEnquiryById)
  .put(protect, updateEnquiry)
  .delete(protect, deleteEnquiry);

export default router;
