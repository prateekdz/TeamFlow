import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "../controllers/projectController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/projects", requireAuth, asyncHandler(listProjects));
router.post("/projects", requireAuth, asyncHandler(createProject));
router.get("/projects/:projectId", requireAuth, asyncHandler(getProject));
router.patch("/projects/:projectId", requireAuth, asyncHandler(updateProject));
router.delete("/projects/:projectId", requireAuth, asyncHandler(deleteProject));

export default router;
