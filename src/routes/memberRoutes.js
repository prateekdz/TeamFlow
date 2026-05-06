import { Router } from "express";
import {
  addMember,
  listMembers,
  removeMember,
  updateMember,
} from "../controllers/memberController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/projects/:projectId/members", requireAuth, asyncHandler(listMembers));
router.post("/projects/:projectId/members", requireAuth, asyncHandler(addMember));
router.patch(
  "/projects/:projectId/members/:userId",
  requireAuth,
  asyncHandler(updateMember),
);
router.delete(
  "/projects/:projectId/members/:userId",
  requireAuth,
  asyncHandler(removeMember),
);

export default router;
