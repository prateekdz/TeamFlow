import { createHttpError } from "./httpError.js";

/**
 * Parse input with a Zod schema and throw a typed HTTP error on failure.
 *
 * @template T
 * @param {import("zod").ZodSchema<T>} schema
 * @param {unknown} payload
 * @param {string} label
 * @returns {T}
 */
export function parseWithSchema(schema, payload, label) {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw createHttpError(400, `Invalid ${label}`, {
      issues: result.error.issues,
    });
  }

  return result.data;
}
