import asyncHandler from "../middlewares/asyncHandler.js";
import User from "../modals/user.js";
import { createRecentActivity } from "../helpers/createRecentActivity.js";
import { buildActivityMessage } from "../helpers/buildActivityMessage.js";
import { RESOURCES } from "../constants/resources.js";
import { ACTIONS } from "../constants/actions.js";
import {
  getRequesterRole,
  getAllowedRolesForRequester,
} from "../services/authorization/userManagement.js";
import { hasPolicyScopeAll, isAdmin } from "../services/authorization/index.js";

//@route GET /api/admin/users
//@desc Get all users(Admin only)
//@access Private/Admin

const getUsers = asyncHandler(async (req, res) => {
  const requesterRole = getRequesterRole(req);
  const allowedRoles = getAllowedRolesForRequester(requesterRole);

  if (!allowedRoles.length) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const query =
    requesterRole === "super_admin" ? {} : { role: { $in: allowedRoles } };

  const users = await User.find(query);
  return res.json(users);
});

//@route GET /api/admin/users/assignable
//@desc Get assignable users for facility team assignment
//@access Private (permission-based)
const getAssignableUsers = asyncHandler(async (req, res) => {
  const user = req.user;
  const canAssignFacilityTeam =
    isAdmin(user) ||
    hasPolicyScopeAll(user, RESOURCES.FACILITY, ACTIONS.CREATE) ||
    hasPolicyScopeAll(user, RESOURCES.FACILITY, ACTIONS.UPDATE) ||
    hasPolicyScopeAll(user, RESOURCES.FACILITY, ACTIONS.ASSIGN);

  if (!canAssignFacilityTeam) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const users = await User.find({
    role: { $nin: ["super_admin", "admin"] },
  }).select("-password");

  return res.json(users);
});

//@route POST /api/admin/users
//@desc Add a new user(Admin only)
//@access Private/Admin

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const requesterRole = getRequesterRole(req);
  const allowedRoles = getAllowedRolesForRequester(requesterRole);
  const targetRole = role || "auditor";

  if (!allowedRoles.includes(targetRole)) {
    return res.status(403).json({
      message: `You can create only: ${allowedRoles.join(", ")}`,
    });
  }

  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ message: "User already exists." });
  }

  user = new User({
    name,
    email,
    password,
    role: targetRole,
  });

  await user.save();

  await createRecentActivity({
    actor: req.user,
    action: "created",
    entity_type: "user",
    entity_id: user._id,
    entity_name: user.name,
    message: buildActivityMessage({
      actorName: req.user?.name || "Admin",
      action: "created",
      entityLabel: "user",
      entityName: user.name,
    }),
    meta: {
      email: user.email,
      role: user.role,
      permissions_count: Array.isArray(user.permissions)
        ? user.permissions.length
        : 0,
    },
  });

  return res.status(201).json({
    message: "User Created successfully.",
    user,
  });
});

//@route PUT /api/admin/users/:id
//@desc Add a new user(Admin only)
//@access Private/Admin

const updateUser = asyncHandler(async (req, res) => {
  const requesterRole = getRequesterRole(req);
  const allowedRoles = getAllowedRolesForRequester(requesterRole);
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!allowedRoles.includes(user.role)) {
    return res
      .status(403)
      .json({ message: "You are not allowed to update this user role" });
  }

  const updatedFields = [];

  if (req.body.name && req.body.name !== user.name) {
    user.name = req.body.name;
    updatedFields.push("name");
  }

  if (req.body.email && req.body.email !== user.email) {
    user.email = req.body.email;
    updatedFields.push("email");
  }

  if (req.body.role && req.body.role !== user.role) {
    if (!allowedRoles.includes(req.body.role)) {
      return res.status(403).json({
        message: `You can assign only: ${allowedRoles.join(", ")}`,
      });
    }
    user.role = req.body.role;
    updatedFields.push("role");
  }

  if (typeof req.body.password === "string" && req.body.password.trim()) {
    user.password = req.body.password.trim();
    updatedFields.push("password");
  }

  const updatedUser = await user.save();

  await createRecentActivity({
    actor: req.user,
    action: "updated",
    entity_type: "user",
    entity_id: updatedUser._id,
    entity_name: updatedUser.name,
    message: buildActivityMessage({
      actorName: req.user?.name || "Admin",
      action: "updated",
      entityLabel: "user",
      entityName: updatedUser.name,
    }),
    meta: {
      updated_fields: updatedFields,
      email: updatedUser.email,
      role: updatedUser.role,
      permissions_count: Array.isArray(updatedUser.permissions)
        ? updatedUser.permissions.length
        : 0,
    },
  });

  return res.status(200).json({
    message: "User updated successfully",
    user: updatedUser,
  });
});

//@route DELETE /api/admin/users/:id
//@desc Delete a user(Admin only)
//@access Private/Admin

const deleteUser = asyncHandler(async (req, res) => {
  const requesterRole = getRequesterRole(req);
  const allowedRoles = getAllowedRolesForRequester(requesterRole);
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!allowedRoles.includes(user.role)) {
    return res
      .status(403)
      .json({ message: "You are not allowed to delete this user role" });
  }

  const userName = user.name;
  const userEmail = user.email;
  const userRole = user.role;

  await user.deleteOne();

  await createRecentActivity({
    actor: req.user,
    action: "deleted",
    entity_type: "user",
    entity_id: user._id,
    entity_name: userName,
    message: buildActivityMessage({
      actorName: req.user?.name || "Admin",
      action: "deleted",
      entityLabel: "user",
      entityName: userName,
    }),
    meta: {
      email: userEmail,
      role: userRole,
    },
  });

  return res.json({
    message: "User deleted successfully",
  });
});

export { getUsers, getAssignableUsers, createUser, updateUser, deleteUser };
