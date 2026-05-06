import pino from "pino";
import config from "./index.js";

/**
 * Create the shared application logger.
 *
 * @returns {import("pino").Logger}
 */
export function createLogger() {
  return pino({
    level: config.logLevel,
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
    ],
    ...(config.isProduction
      ? {}
      : {
          transport: {
            target: "pino-pretty",
            options: { colorize: true },
          },
        }),
  });
}

export const logger = createLogger();
