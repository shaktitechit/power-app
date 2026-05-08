import asyncHandler from "../middlewares/asyncHandler.js";
import mongoose from "mongoose";
import Facility from "../modals/facility.js";
import FacilityAuditor from "../modals/facilityAuditor.js";
import UtilityAccount from "../modals/utilityAccount.js";
import { uploadBufferToFileManagement } from "../utils/fileManagementUpload.js";
import { createRecentActivity } from "../helpers/createRecentActivity.js";
import { buildActivityMessage } from "../helpers/buildActivityMessage.js";
import { isUtilityAuditCompleted } from "../helpers/auditState.js";
import {
  isAdmin,
  hasOrgWideFacilityAccess,
  resolveAccessibleFacility,
  can,
} from "../services/authorization/index.js";
import { RESOURCES } from "../constants/resources.js";
import { ACTIONS } from "../constants/actions.js";

// helper: parse auditor ids safely
const parseAuditorIds = (auditor_ids) => {
  let parsedAuditorIds = [];

  if (auditor_ids) {
    if (Array.isArray(auditor_ids)) {
      parsedAuditorIds = auditor_ids;
    } else {
      try {
        parsedAuditorIds = JSON.parse(auditor_ids);
      } catch {
        parsedAuditorIds = [auditor_ids];
      }
    }
  }

  return parsedAuditorIds;
};

const parseClientRepresentatives = (client_representatives) => {
  if (!client_representatives) return [];

  let parsed = [];
  if (Array.isArray(client_representatives)) {
    parsed = client_representatives;
  } else {
    try {
      parsed = JSON.parse(client_representatives);
    } catch {
      parsed = [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((rep) => ({
      name: String(rep?.name || "").trim(),
      contact_number: String(rep?.contact_number || "").trim(),
      email: String(rep?.email || "").trim(),
    }))
    .filter((rep) => rep.name || rep.contact_number || rep.email);
};

// helper: upload documents
const uploadFacilityDocuments = async (files = [], facilityId) => {
  const uploadedDocuments = [];

  if (files && files.length > 0) {
    for (const file of files) {
      const uploaded = await uploadBufferToFileManagement(
        file,
        "facilities",
        facilityId,
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

// @route POST /api/v1/facilities
// @desc Create a Facility
// @access Protected
const createFacility = asyncHandler(async (req, res) => {
  const {
    name,
    city,
    address,
    client_representative,
    client_contact_number,
    client_email,
    facility_type,
    audit_type,
    status,
    start_date,
    closure_date,
    auditor_ids,
    client_representatives,
  } = req.body;

  if (!name || !city) {
    res.status(400);
    throw new Error("Name and city are required");
  }

  const parsedAuditorIds = parseAuditorIds(auditor_ids);
  const parsedClientRepresentatives = parseClientRepresentatives(
    client_representatives,
  );
  const fallbackClientRepresentatives = parsedClientRepresentatives.length
    ? parsedClientRepresentatives
    : client_representative || client_contact_number || client_email
      ? [
          {
            name: String(client_representative || "").trim(),
            contact_number: String(client_contact_number || "").trim(),
            email: String(client_email || "").trim(),
          },
        ]
      : [];
  const facilityId = new mongoose.Types.ObjectId();
  const uploadedDocuments = await uploadFacilityDocuments(
    req.files,
    facilityId,
  );

  const facility = await Facility.create({
    _id: facilityId,
    owner_user_id: req.user._id,
    created_by: req.user._id,
    name,
    city,
    address,
    client_representative,
    client_contact_number,
    client_email,
    client_representatives: fallbackClientRepresentatives,
    facility_type: facility_type !== undefined && facility_type !== null
      ? String(facility_type).trim()
      : "",
    audit_type,
    status,
    start_date,
    closure_date,
    documents: uploadedDocuments,
  });

  if (parsedAuditorIds.length > 0) {
    const facilityAuditorDocs = parsedAuditorIds.map((auditorId) => ({
      facility_id: facility._id,
      user_id: auditorId,
      assigned_by: req.user._id,
    }));

    await FacilityAuditor.insertMany(facilityAuditorDocs, { ordered: false });

    await createRecentActivity({
      actor: req.user,
      action: "assigned",
      entity_type: "facility",
      entity_id: facility._id,
      entity_name: facility.name,
      facility_id: facility._id,
      message: `${req.user?.name || "User"} assigned auditors to facility "${facility.name}"`,
      meta: {
        auditor_ids: parsedAuditorIds,
      },
    });
  }

  await createRecentActivity({
    actor: req.user,
    action: "created",
    entity_type: "facility",
    entity_id: facility._id,
    entity_name: facility.name,
    facility_id: facility._id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "created",
      entityLabel: "facility",
      entityName: facility.name,
    }),
    meta: {
      city: facility.city,
      facility_type: facility.facility_type,
      assigned_auditors_count: parsedAuditorIds.length,
    },
  });

  res.status(201).json({
    success: true,
    message: "Facility created successfully",
    data: facility,
  });
});

// @route GET /api/v1/facilities
// @desc Get all Facilities
// @access Protected
const getFacilities = asyncHandler(async (req, res) => {
  let facilities = [];

  if (hasOrgWideFacilityAccess(req.user)) {
    facilities = await Facility.find().sort({ start_date: -1, createdAt: -1 });
  } else {
    const assignedFacilityIds = await FacilityAuditor.find({
      user_id: req.user._id,
    }).distinct("facility_id");
    // Manager visibility is strictly assignment-based from FacilityAuditor mappings.
    if (req.user?.role === "manager") {
      facilities = await Facility.find({
        _id: { $in: assignedFacilityIds },
      }).sort({ start_date: -1, createdAt: -1 });
    } else {
      facilities = await Facility.find({
        $or: [
          { owner_user_id: req.user._id },
          { _id: { $in: assignedFacilityIds } },
        ],
      }).sort({ start_date: -1, createdAt: -1 });
    }
  }

  res.status(200).json({
    success: true,
    count: facilities.length,
    data: facilities,
  });
});

// @route GET /api/v1/facilities/:id
// @desc Get single Facility
// @access Protected
const getFacilityById = asyncHandler(async (req, res) => {
  const facility = await resolveAccessibleFacility(req.user, req.params.id);

  if (!facility) {
    res.status(404);
    throw new Error("Facility not found");
  }

  await facility.populate([
    { path: "audit_closure.closed_by", select: "name email" },
    { path: "audit_closure.reopened_by", select: "name email" },
  ]);

  const assignedAuditors = await FacilityAuditor.find({
    facility_id: facility._id,
  })
    .populate("user_id", "name email")
    .select("user_id assigned_by createdAt");

  res.status(200).json({
    success: true,
    data: {
      facility,
      assignedAuditors,
    },
  });
});

// @route PUT /api/v1/facilities/:id
// @desc Update Facility
// @access Protected
const updateFacility = asyncHandler(async (req, res) => {
  const {
    name,
    city,
    address,
    client_representative,
    client_contact_number,
    client_email,
    facility_type,
    audit_type,
    status,
    start_date,
    closure_date,
    auditor_ids,
    client_representatives,
  } = req.body;

  let facility;

  facility = await resolveAccessibleFacility(req.user, req.params.id);

  if (!facility) {
    res.status(404);
    throw new Error("Facility not found");
  }

  const parsedAuditorIds = parseAuditorIds(auditor_ids);
  const parsedClientRepresentatives = parseClientRepresentatives(
    client_representatives,
  );
  const uploadedDocuments = await uploadFacilityDocuments(
    req.files,
    facility._id,
  );
  const updatedFields = Object.keys(req.body || {});

  facility.name = name ?? facility.name;
  facility.city = city ?? facility.city;
  facility.address = address ?? facility.address;
  facility.client_representative =
    client_representative ?? facility.client_representative;
  facility.client_contact_number =
    client_contact_number ?? facility.client_contact_number;
  facility.client_email = client_email ?? facility.client_email;
  if (client_representatives !== undefined) {
    facility.client_representatives = parsedClientRepresentatives;
  } else if (
    client_representative !== undefined ||
    client_contact_number !== undefined ||
    client_email !== undefined
  ) {
    const derivedName =
      client_representative ?? facility.client_representative ?? "";
    const derivedContact =
      client_contact_number ?? facility.client_contact_number ?? "";
    const derivedEmail = client_email ?? facility.client_email ?? "";
    facility.client_representatives = [
      {
        name: String(derivedName).trim(),
        contact_number: String(derivedContact).trim(),
        email: String(derivedEmail).trim(),
      },
    ].filter((rep) => rep.name || rep.contact_number || rep.email);
  }
  if (facility_type !== undefined) {
    facility.facility_type = String(facility_type).trim();
  }
  if (audit_type !== undefined) {
    facility.audit_type = audit_type;
  }
  facility.status = status ?? facility.status;
  facility.start_date = start_date ?? facility.start_date;
  facility.closure_date = closure_date ?? facility.closure_date;

  if (uploadedDocuments.length > 0) {
    facility.documents = [...(facility.documents || []), ...uploadedDocuments];
    updatedFields.push("documents");
  }

  const updatedFacility = await facility.save();

  if (auditor_ids !== undefined) {
    await FacilityAuditor.deleteMany({ facility_id: facility._id });

    if (parsedAuditorIds.length > 0) {
      const facilityAuditorDocs = parsedAuditorIds.map((auditorId) => ({
        facility_id: facility._id,
        user_id: auditorId,
        assigned_by: req.user._id,
      }));

      await FacilityAuditor.insertMany(facilityAuditorDocs, { ordered: false });
    }

    await createRecentActivity({
      actor: req.user,
      action: "assigned",
      entity_type: "facility",
      entity_id: facility._id,
      entity_name: facility.name,
      facility_id: facility._id,
      message: `${req.user?.name || "User"} updated auditors for facility "${facility.name}"`,
      meta: {
        auditor_ids: parsedAuditorIds,
      },
    });
  }

  const assignedAuditors = await FacilityAuditor.find({
    facility_id: facility._id,
  }).select("user_id assigned_by createdAt");

  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "facility",
    entity_id: updatedFacility._id,
    entity_name: updatedFacility.name,
    facility_id: updatedFacility._id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "facility",
      entityName: updatedFacility.name,
    }),
    meta: {
      updated_fields: [...new Set(updatedFields)],
      status: updatedFacility.status,
    },
  });

  res.status(200).json({
    success: true,
    message: "Facility updated successfully",
    data: {
      facility: updatedFacility,
      assignedAuditors,
    },
  });
});

// @route DELETE /api/v1/facilities/:id
// @desc Delete Facility
// @access Protected
const deleteFacility = asyncHandler(async (req, res) => {
  const query = isAdmin(req.user)
    ? { _id: req.params.id }
    : { _id: req.params.id, owner_user_id: req.user._id };

  const facility = await Facility.findOne(query);

  if (!facility) {
    res.status(404);
    throw new Error("Facility not found");
  }

  const name = facility.name;
  const city = facility.city;

  await FacilityAuditor.deleteMany({ facility_id: facility._id });
  await facility.deleteOne();

  await createRecentActivity({
    actor: req.user,
    action: "deleted",
    entity_type: "facility",
    entity_id: facility._id,
    entity_name: name,
    facility_id: facility._id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "deleted",
      entityLabel: "facility",
      entityName: name,
    }),
    meta: {
      city,
    },
  });

  res.status(200).json({
    success: true,
    message: "Facility deleted successfully",
  });
});

// @route POST /api/v1/facilities/:id/audit-close
// @desc Close facility audit (when all utility audits are completed)
// @access Protected
const closeFacilityAudit = asyncHandler(async (req, res) => {
  const facility = await resolveAccessibleFacility(req.user, req.params.id);

  if (!facility) {
    res.status(404);
    throw new Error("Facility not found");
  }

  const mayClose = await can(req.user, RESOURCES.FACILITY, ACTIONS.CLOSE_FACILITY_AUDIT, {
    facilityId: req.params.id,
  });
  if (!mayClose) {
    res.status(403);
    throw new Error("You do not have permission to close this facility audit");
  }

  const utilities = await UtilityAccount.find({ facility_id: facility._id });
  if (!utilities.length) {
    res.status(400);
    throw new Error("Cannot close audit: no utility accounts found");
  }

  const allUtilitiesCompleted = utilities.every((utility) =>
    isUtilityAuditCompleted(utility),
  );

  if (!allUtilitiesCompleted) {
    res.status(400);
    throw new Error(
      "Cannot close facility audit until all utility audits are completed",
    );
  }

  facility.audit_closure = {
    ...(facility.audit_closure || {}),
    closed_at: new Date(),
    closed_by: req.user._id,
  };
  await facility.save();

  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "facility",
    entity_id: facility._id,
    entity_name: facility.name,
    facility_id: facility._id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "facility audit",
      entityName: `${facility.name} (closed)`,
    }),
    meta: {
      audit_closed: true,
    },
  });

  res.status(200).json({
    success: true,
    message: "Facility audit closed successfully",
    data: facility,
  });
});

// @route POST /api/v1/facilities/:id/audit-open
// @desc Re-open facility audit (users with policy + facility access, e.g. admin or assigned manager)
// @access Protected
const openFacilityAudit = asyncHandler(async (req, res) => {
  const facility = await resolveAccessibleFacility(req.user, req.params.id);

  if (!facility) {
    res.status(404);
    throw new Error("Facility not found");
  }

  const mayReopen = await can(req.user, RESOURCES.FACILITY, ACTIONS.REOPEN_FACILITY_AUDIT, {
    facilityId: req.params.id,
  });
  if (!mayReopen) {
    res.status(403);
    throw new Error("You do not have permission to re-open this facility audit");
  }

  facility.audit_closure = {
    ...(facility.audit_closure || {}),
    closed_at: undefined,
    closed_by: undefined,
    reopened_at: new Date(),
    reopened_by: req.user._id,
  };
  await facility.save();

  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "facility",
    entity_id: facility._id,
    entity_name: facility.name,
    facility_id: facility._id,
    message: buildActivityMessage({
      actorName: req.user?.name || "User",
      action: "updated",
      entityLabel: "facility audit",
      entityName: `${facility.name} (re-opened)`,
    }),
    meta: {
      audit_reopened: true,
    },
  });

  res.status(200).json({
    success: true,
    message: "Facility audit opened successfully",
    data: facility,
  });
});

export {
  createFacility,
  getFacilities,
  getFacilityById,
  updateFacility,
  deleteFacility,
  closeFacilityAudit,
  openFacilityAudit,
};
