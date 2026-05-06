import {
  AddProjectMemberBody,
  AddProjectMemberParams,
  ListProjectMembersParams,
  RemoveProjectMemberParams,
  UpdateProjectMemberRoleBody,
  UpdateProjectMemberRoleParams,
} from "../models/apiSchemas.js";
import {
  addMemberToProject,
  listMembersForProject,
  removeMemberFromProject,
  updateMemberRole,
} from "../services/memberService.js";
import { parseWithSchema } from "../utils/validation.js";

/**
 * List members for a project.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function listMembers(req, res) {
  const { projectId } = parseWithSchema(
    ListProjectMembersParams,
    req.params,
    "member params",
  );

  const members = await listMembersForProject(projectId, req.dbUserId);
  res.json(members);
}

/**
 * Add a member to a project.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function addMember(req, res) {
  const { projectId } = parseWithSchema(AddProjectMemberParams, req.params, "member params");
  const payload = parseWithSchema(AddProjectMemberBody, req.body, "member payload");
  const member = await addMemberToProject(projectId, req.dbUserId, payload);
  res.status(201).json(member);
}

/**
 * Update a project member's role.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function updateMember(req, res) {
  const { projectId, userId } = parseWithSchema(
    UpdateProjectMemberRoleParams,
    req.params,
    "member params",
  );
  const payload = parseWithSchema(
    UpdateProjectMemberRoleBody,
    req.body,
    "member payload",
  );
  const member = await updateMemberRole(projectId, req.dbUserId, userId, payload);
  res.json(member);
}

/**
 * Remove a member from a project.
 *
 * @param {import("express").Request & { dbUserId: number }} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export async function removeMember(req, res) {
  const { projectId, userId } = parseWithSchema(
    RemoveProjectMemberParams,
    req.params,
    "member params",
  );
  await removeMemberFromProject(projectId, req.dbUserId, userId);
  res.sendStatus(204);
}
