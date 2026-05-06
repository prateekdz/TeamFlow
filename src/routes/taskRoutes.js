import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "../controllers/taskController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/projects/:projectId/tasks", requireAuth, asyncHandler(listTasks));
router.post("/projects/:projectId/tasks", requireAuth, asyncHandler(createTask));
router.get("/projects/:projectId/tasks/:taskId", requireAuth, asyncHandler(getTask));
router.patch("/projects/:projectId/tasks/:taskId", requireAuth, asyncHandler(updateTask));
router.delete("/projects/:projectId/tasks/:taskId", requireAuth, asyncHandler(deleteTask));

export default router;
