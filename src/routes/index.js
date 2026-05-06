import { Router } from "express";
import dashboardRoutes from "./dashboardRoutes.js";
import healthRoutes from "./healthRoutes.js";
import memberRoutes from "./memberRoutes.js";
import projectRoutes from "./projectRoutes.js";
import taskRoutes from "./taskRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.use(healthRoutes);
router.use(userRoutes);
router.use(projectRoutes);
router.use(memberRoutes);
router.use(taskRoutes);
router.use(dashboardRoutes);

export default router;
