import { Router } from "express";
import { getHealth } from "../controllers/healthController.js";
import { getAuth } from "@clerk/express";
import { syncAuthenticatedUser } from "../services/authService.js";

const router = Router();

router.get("/healthz", getHealth);

router.get("/debug-auth", async (req, res) => {
  try {
    const auth = getAuth(req);
    const claims = auth?.sessionClaims ?? {};
    const result = await syncAuthenticatedUser(auth);
    res.json({ ok: true, userId: auth?.userId, claims, dbResult: result });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack, code: e.code });
  }
});

export default router;
