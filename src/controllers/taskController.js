import {
  CreateTaskBody,
  CreateTaskParams,
  DeleteTaskParams,
  GetTaskParams,
  ListTasksParams,
  ListTasksQueryParams,
  UpdateTaskBody,
  UpdateTaskParams,
} from "../models/apiSchemas.js";
import {
  createTaskForProject,
  deleteTaskForProject,
  getTaskForProject,
  listTasksForProject,
  updateTaskForProject,
} from "../services/taskService.js";
import { parseWithSchema } from "../utils/validation.js";

/**
 * List all tasks for a project.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function listTasks(req, res) {
  const { projectId } = parseWithSchema(ListTasksParams, req.params, "task params");
  const query = parseWithSchema(ListTasksQueryParams, req.query, "task query");
  const tasks = await listTasksForProject(projectId, req.dbUserId, query);
  res.json(tasks);
}

/**
 * Create a task in a project.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function createTask(req, res) {
  const { projectId } = parseWithSchema(CreateTaskParams, req.params, "task params");
  const payload = parseWithSchema(CreateTaskBody, req.body, "task payload");
  const task = await createTaskForProject(projectId, req.dbUserId, payload);
  res.status(201).json(task);
}

/**
 * Fetch one task by ID.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function getTask(req, res) {
  const { projectId, taskId } = parseWithSchema(GetTaskParams, req.params, "task params");
  const task = await getTaskForProject(projectId, taskId, req.dbUserId);
  res.json(task);
}

/**
 * Update one task by ID.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function updateTask(req, res) {
  const { projectId, taskId } = parseWithSchema(UpdateTaskParams, req.params, "task params");
  const payload = parseWithSchema(UpdateTaskBody, req.body, "task payload");
  const task = await updateTaskForProject(projectId, taskId, req.dbUserId, payload);
  res.json(task);
}

/**
 * Delete one task by ID.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function deleteTask(req, res) {
  const { projectId, taskId } = parseWithSchema(DeleteTaskParams, req.params, "task params");
  await deleteTaskForProject(projectId, taskId, req.dbUserId);
  res.sendStatus(204);
}
