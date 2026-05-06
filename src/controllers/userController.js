import { UpdateMeBody } from "../models/apiSchemas.js";
import { updateCurrentUser, getCurrentUser } from "../services/userService.js";
import { parseWithSchema } from "../utils/validation.js";

/**
 * Return the current user profile.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function getMe(req, res) {
  const user = await getCurrentUser(req.dbUserId);
  res.json(user);
}

/**
 * Update the current user profile.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function updateMe(req, res) {
  const payload = parseWithSchema(UpdateMeBody, req.body, "user profile");
  const user = await updateCurrentUser(req.dbUserId, payload);
  res.json(user);
}
