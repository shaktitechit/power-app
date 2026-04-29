import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/authorizeMiddleware.js";
import { RESOURCES } from "../constants/resources.js";
import { ACTIONS } from "../constants/actions.js";
import UtilityAccount from "../modals/utilityAccount.js";
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
const resolveUtilityFacilityContext = async (req) => {
  const utility = await UtilityAccount.findById(req.params.id).select("facility_id");
  return { facilityId: utility?.facility_id?.toString?.() || null };
};

router
  .route("/")
  .post(
    protect,
    authorize(RESOURCES.UTILITY_ACCOUNT, ACTIONS.CREATE, {
      resolveContext: (req) => ({ facilityId: req.body?.facility_id }),
    }),
    uploadDocuments,
    createUtilityAccount,
  )
  .get(protect, getUtilityAccounts);

router.post(
  "/:id/audit-step-submit",
  protect,
  authorize(RESOURCES.UTILITY_AUDIT_FLOW, ACTIONS.SUBMIT_AUDIT_STEP, {
    resolveContext: resolveUtilityFacilityContext,
  }),
  submitUtilityAuditStep,
);
router.post(
  "/:id/audit-step-allow",
  protect,
  authorize(RESOURCES.UTILITY_AUDIT_FLOW, ACTIONS.ALLOW_AUDIT_STEP, {
    resolveContext: resolveUtilityFacilityContext,
  }),
  allowUtilityAuditStep,
);
router.post(
  "/:id/audit-no-data-declare",
  protect,
  authorize(RESOURCES.UTILITY_AUDIT_FLOW, ACTIONS.DECLARE_NO_DATA, {
    resolveContext: resolveUtilityFacilityContext,
  }),
  declareAuditStepNoData,
);
router.post(
  "/:id/audit-no-data-clear",
  protect,
  authorize(RESOURCES.UTILITY_AUDIT_FLOW, ACTIONS.CLEAR_NO_DATA, {
    resolveContext: resolveUtilityFacilityContext,
  }),
  clearAuditStepNoData,
);

router
  .route("/:id")
  .get(
    protect,
    authorize(RESOURCES.UTILITY_ACCOUNT, ACTIONS.READ, {
      resolveContext: resolveUtilityFacilityContext,
    }),
    getUtilityAccountById,
  )
  .put(
    protect,
    authorize(RESOURCES.UTILITY_ACCOUNT, ACTIONS.UPDATE, {
      resolveContext: resolveUtilityFacilityContext,
    }),
    uploadDocuments,
    updateUtilityAccount,
  )
  .delete(
    protect,
    authorize(RESOURCES.UTILITY_ACCOUNT, ACTIONS.DELETE, {
      resolveContext: resolveUtilityFacilityContext,
    }),
    deleteUtilityAccount,
  );

export default router;
