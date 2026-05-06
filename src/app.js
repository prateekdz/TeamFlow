import path from "node:path";
import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import config from "./config/index.js";
import { logger } from "./config/logger.js";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middleware/clerkProxyMiddleware.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import routes from "./routes/index.js";

const app = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (config.clerkEnabled) {
  app.use(
    "/api",
    clerkMiddleware((req) => ({
      publishableKey: publishableKeyFromHost(
        getClerkProxyHost(req) ?? "",
        config.clerkPublishableKey,
      ),
    })),
    routes,
  );
} else {
  logger.warn(
    "Clerk auth is disabled because CLERK_PUBLISHABLE_KEY or CLERK_SECRET_KEY is missing or still using placeholder values.",
  );
  app.use("/api", routes);
}

if (config.isProduction) {
  app.use(express.static(config.publicDir));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(config.publicDir, "index.html"));
  });
} else {
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    const host = req.hostname === "::1" ? "127.0.0.1" : req.hostname || "127.0.0.1";
    const targetUrl = new URL(`http://${host}:${config.clientPort}`);
    targetUrl.pathname = req.path;
    targetUrl.search = req.url.includes("?") ? `?${req.url.split("?")[1]}` : "";
    res.redirect(targetUrl.toString());
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
