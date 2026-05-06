import { Router } from "express";
import {
  getDashboardSummary,
  getMyTasks,
  getOverdueTasks,
  getRecentActivity,
  getDashboardAll,
} from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/dashboard/all", requireAuth, asyncHandler(getDashboardAll));
router.get("/dashboard/summary", requireAuth, asyncHandler(getDashboardSummary));
router.get("/dashboard/my-tasks", requireAuth, asyncHandler(getMyTasks));
router.get("/dashboard/overdue-tasks", requireAuth, asyncHandler(getOverdueTasks));
router.get("/dashboard/activity", requireAuth, asyncHandler(getRecentActivity));

export default router;
