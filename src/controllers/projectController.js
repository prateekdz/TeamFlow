import {
  CreateProjectBody,
  DeleteProjectParams,
  GetProjectParams,
  UpdateProjectBody,
  UpdateProjectParams,
} from "../models/apiSchemas.js";
import {
  createProjectForUser,
  deleteProjectForUser,
  getProjectForUser,
  listProjectsForUser,
  updateProjectForUser,
} from "../services/projectService.js";
import { parseWithSchema } from "../utils/validation.js";

/**
 * List every project visible to the current user.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function listProjects(req, res) {
  const projects = await listProjectsForUser(req.dbUserId);
  res.json(projects);
}

/**
 * Create a new project.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function createProject(req, res) {
  const payload = parseWithSchema(CreateProjectBody, req.body, "project payload");
  const project = await createProjectForUser(req.dbUserId, payload);
  res.status(201).json(project);
}

/**
 * Fetch one project by ID.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function getProject(req, res) {
  const { projectId } = parseWithSchema(GetProjectParams, req.params, "project params");
  const project = await getProjectForUser(projectId, req.dbUserId);
  res.json(project);
}

/**
 * Update one project by ID.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function updateProject(req, res) {
  const { projectId } = parseWithSchema(UpdateProjectParams, req.params, "project params");
  const payload = parseWithSchema(UpdateProjectBody, req.body, "project payload");
  const project = await updateProjectForUser(projectId, req.dbUserId, payload);
  res.json(project);
}

/**
 * Delete one project by ID.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function deleteProject(req, res) {
  const { projectId } = parseWithSchema(DeleteProjectParams, req.params, "project params");
  await deleteProjectForUser(projectId, req.dbUserId);
  res.sendStatus(204);
}
