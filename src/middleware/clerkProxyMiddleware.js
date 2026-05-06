import { createProxyMiddleware } from "http-proxy-middleware";
import config from "../config/index.js";

const CLERK_FRONTEND_API = "https://frontend-api.clerk.dev";
export const CLERK_PROXY_PATH = "/api/__clerk";

/**
 * Resolve the public-facing host for the current request.
 *
 * @param {{ headers: import("http").IncomingHttpHeaders }} req
 * @returns {string | undefined}
 */
export function getClerkProxyHost(req) {
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const firstHop = raw?.split(",")[0]?.trim();

  return firstHop || req.headers.host?.trim() || undefined;
}

/**
 * Create the Clerk proxy middleware used for production custom-domain auth.
 *
 * @returns {import("express").RequestHandler}
 */
export function clerkProxyMiddleware() {
  if (!config.isProduction || !config.clerkSecretKey) {
    return (_req, _res, next) => next();
  }

  return createProxyMiddleware({
    target: CLERK_FRONTEND_API,
    changeOrigin: true,
    pathRewrite: (requestPath) =>
      requestPath.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: {
      proxyReq: (proxyReq, req) => {
        const protocol = req.headers["x-forwarded-proto"] || "https";
        const host = getClerkProxyHost(req) || "";
        const proxyUrl = `${protocol}://${host}${CLERK_PROXY_PATH}`;

        proxyReq.setHeader("Clerk-Proxy-Url", proxyUrl);
        proxyReq.setHeader("Clerk-Secret-Key", config.clerkSecretKey);

        const forwardedFor = req.headers["x-forwarded-for"];
        const clientIp =
          (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
            ?.split(",")[0]
            ?.trim() ||
          req.socket?.remoteAddress ||
          "";

        if (clientIp) {
          proxyReq.setHeader("X-Forwarded-For", clientIp);
        }
      },
    },
  });
}
