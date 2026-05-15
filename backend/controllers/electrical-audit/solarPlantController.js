import asyncHandler from "../../middlewares/asyncHandler.js";
import mongoose from "mongoose";
import SolarPlant from "../../modals/electrical-audit/solarPlant.js";
import UtilityAccount from "../../modals/utilityAccount.js";
import { uploadBufferToFileManagement } from "../../utils/fileManagementUpload.js";

import { createRecentActivity } from "../../helpers/createRecentActivity.js";
import { buildActivityMessage } from "../../helpers/buildActivityMessage.js";
import {
  isAdmin,
  resolveAccessibleUtilityAccount,
} from "../../services/authorization/index.js";

// 📂 Upload plant documents
const uploadSolarPlantDocuments = async (files = [], solarPlantId) => {
  const uploadedDocuments = [];

  if (files && files.length > 0) {
    for (const file of files) {
      const uploaded = await uploadBufferToFileManagement(
        file,
        "solar-plants",
        solarPlantId,
      );

      uploadedDocuments.push({
        fileUrl: uploaded.secure_url,
        fileType: file.mimetype === "application/pdf" ? "pdf" : "image",
        fileName: file.originalname,
      });
    }
  }

  return uploadedDocuments;
};

//
// 🚀 CREATE SOLAR PLANT
//
const createSolarPlant = asyncHandler(async (req, res) => {
  const {
    facility_id,
    utility_account_id,
    plant_name,
    rating_kWp,
    panel_rating_watt,
    no_of_panels,
    inverter_make,
    inverter_rating_kW,
    audit_date,
    auditor_id,
  } = req.body;

  if (!facility_id || !utility_account_id) {
    res.status(400);
    throw new Error("facility_id and utility_account_id are required");
  }

  const utility = await resolveAccessibleUtilityAccount(
    req.user,
    utility_account_id,
  );

  if (!utility) {
    res.status(403);
    throw new Error("Access denied");
  }

  if (utility.facility_id.toString() !== facility_id.toString()) {
    res.status(400);
    throw new Error("utility_account_id does not belong to the given facility");
  }

  const solarPlantId = new mongoose.Types.ObjectId();
  const uploadedDocuments = await uploadSolarPlantDocuments(
    req.files,
    solarPlantId,
  );

  const solarPlant = await SolarPlant.create({
    _id: solarPlantId,
    facility_id,
    utility_account_id,
    plant_name,
    rating_kWp,
    panel_rating_watt,
    no_of_panels,
    inverter_make,
    inverter_rating_kW,
    audit_date,
    auditor_id,
    documents: uploadedDocuments,
  });

  // ✅ ACTIVITY
  await createRecentActivity({
    actor: req.user,
    action: "created",
    entity_type: "solar_plant",
    entity_id: solarPlant._id,
    entity_name: solarPlant.plant_name || "Solar Plant",
    facility_id: solarPlant.facility_id,
    utility_account_id: solarPlant.utility_account_id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "created",
      entityLabel: "solar plant",
      entityName: solarPlant.plant_name || "",
    }),
    meta: {
      rating_kWp: solarPlant.rating_kWp,
      no_of_panels: solarPlant.no_of_panels,
      inverter_rating_kW: solarPlant.inverter_rating_kW,
    },
  });

  res.status(201).json({
    success: true,
    message: "Solar plant created successfully",
    data: solarPlant,
  });
});

//
// 📥 GET ALL (UNCHANGED)
//
const getSolarPlants = asyncHandler(async (req, res) => {
  const { facility_id, utility_account_id } = req.query;

  const query = {};

  if (facility_id) query.facility_id = facility_id;
  if (utility_account_id) query.utility_account_id = utility_account_id;

  let solarPlants;

  if (isAdmin(req.user)) {
    solarPlants = await SolarPlant.find(query)
      .populate("facility_id", "name city")
      .populate("utility_account_id", "account_number utility_type")
      .populate("auditor_id", "name email")
      .sort({ created_at: -1 });
  } else {
    const utilities = await UtilityAccount.find();
    const allowedUtilityIds = [];

    for (const utility of utilities) {
      const access = await resolveAccessibleUtilityAccount(req.user, utility._id);
      if (access) allowedUtilityIds.push(utility._id);
    }

    const userQuery = {
      ...query,
      utility_account_id: query.utility_account_id
        ? query.utility_account_id
        : { $in: allowedUtilityIds },
    };

    if (
      query.utility_account_id &&
      !allowedUtilityIds.some(
        (id) => id.toString() === query.utility_account_id.toString(),
      )
    ) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    solarPlants = await SolarPlant.find(userQuery)
      .populate("facility_id", "name city")
      .populate("utility_account_id", "account_number utility_type")
      .populate("auditor_id", "name email")
      .sort({ created_at: -1 });
  }

  res.status(200).json({
    success: true,
    count: solarPlants.length,
    data: solarPlants,
  });
});

//
// 📄 GET SINGLE (UNCHANGED)
//
const getSolarPlantById = asyncHandler(async (req, res) => {
  const solarPlant = await SolarPlant.findById(req.params.id)
    .populate("facility_id", "name city address")
    .populate("utility_account_id", "account_number utility_type")
    .populate("auditor_id", "name email");

  if (!solarPlant) {
    res.status(404);
    throw new Error("Solar plant not found");
  }

  const utility = await resolveAccessibleUtilityAccount(
    req.user,
    solarPlant.utility_account_id._id,
  );

  if (!utility) {
    res.status(403);
    throw new Error("Access denied");
  }

  res.status(200).json({
    success: true,
    data: solarPlant,
  });
});

//
// ✏️ UPDATE
//
const updateSolarPlant = asyncHandler(async (req, res) => {
  const solarPlant = await SolarPlant.findById(req.params.id);

  if (!solarPlant) {
    res.status(404);
    throw new Error("Solar plant not found");
  }

  const utility = await resolveAccessibleUtilityAccount(
    req.user,
    solarPlant.utility_account_id,
  );

  if (!utility) {
    res.status(403);
    throw new Error("Access denied");
  }

  if (req.body.utility_account_id) {
    const newUtility = await resolveAccessibleUtilityAccount(
      req.user,
      req.body.utility_account_id,
    );

    if (!newUtility) {
      res.status(403);
      throw new Error("Access denied for new utility account");
    }

    const targetFacilityId =
      req.body.facility_id || solarPlant.facility_id.toString();

    if (newUtility.facility_id.toString() !== targetFacilityId.toString()) {
      res.status(400);
      throw new Error(
        "utility_account_id does not belong to the given facility",
      );
    }
  }

  const updatedFields = Object.keys(req.body || {});
  const uploadedDocuments = await uploadSolarPlantDocuments(
    req.files,
    solarPlant._id,
  );

  Object.keys(req.body).forEach((key) => {
    solarPlant[key] = req.body[key] ?? solarPlant[key];
  });

  if (uploadedDocuments.length > 0) {
    solarPlant.documents = [
      ...(solarPlant.documents || []),
      ...uploadedDocuments,
    ];
    updatedFields.push("documents");
  }

  const updated = await solarPlant.save();

  // ✅ ACTIVITY
  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "solar_plant",
    entity_id: updated._id,
    entity_name: updated.plant_name || "Solar Plant",
    facility_id: updated.facility_id,
    utility_account_id: updated.utility_account_id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "solar plant",
      entityName: updated.plant_name || "",
    }),
    meta: {
      updated_fields: [...new Set(updatedFields)],
      rating_kWp: updated.rating_kWp,
      no_of_panels: updated.no_of_panels,
      inverter_rating_kW: updated.inverter_rating_kW,
    },
  });

  res.status(200).json({
    success: true,
    message: "Solar plant updated successfully",
    data: updated,
  });
});

//
// ❌ DELETE
//
const deleteSolarPlant = asyncHandler(async (req, res) => {
  const solarPlant = await SolarPlant.findById(req.params.id);

  if (!solarPlant) {
    res.status(404);
    throw new Error("Solar plant not found");
  }

  const utility = await resolveAccessibleUtilityAccount(
    req.user,
    solarPlant.utility_account_id,
  );

  if (!utility) {
    res.status(403);
    throw new Error("Access denied");
  }

  const entityName = solarPlant.plant_name || "Solar Plant";
  const facilityId = solarPlant.facility_id;
  const utilityId = solarPlant.utility_account_id;
  const rating = solarPlant.rating_kWp;

  await solarPlant.softDelete();

  // ✅ ACTIVITY
  await createRecentActivity({
    actor: req.user,
    action: "deleted",
    entity_type: "solar_plant",
    entity_id: solarPlant._id,
    entity_name: entityName,
    facility_id: facilityId,
    utility_account_id: utilityId,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "deleted",
      entityLabel: "solar plant",
      entityName,
    }),
    meta: {
      rating_kWp: rating,
    },
  });

  res.status(200).json({
    success: true,
    message: "Solar plant deleted successfully",
  });
});

export {
  createSolarPlant,
  getSolarPlants,
  getSolarPlantById,
  updateSolarPlant,
  deleteSolarPlant,
};
