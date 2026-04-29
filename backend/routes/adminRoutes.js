import express from "express";
import { protect, admin } from "../middlewares/authMiddleware.js";
import {
  getUsers,
  getAssignableUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/adminController.js";

const router = express.Router();
router.get("/", protect, admin, getUsers);
router.get("/assignable", protect, getAssignableUsers);
router.post("/", protect, admin, createUser);
router.put("/:id", protect, admin, updateUser);
router.delete("/:id", protect, admin, deleteUser);

export default router;
