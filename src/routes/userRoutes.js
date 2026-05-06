import { Router } from "express";
import { getMe, updateMe } from "../controllers/userController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/users/me", requireAuth, asyncHandler(getMe));
router.patch("/users/me", requireAuth, asyncHandler(updateMe));

export default router;
