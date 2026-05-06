import "dotenv/config";
import app from "./app.js";
import config from "./config/index.js";
import { logger } from "./config/logger.js";

const server = app.listen(config.port, (error) => {
  if (error) {
    logger.error({ err: error }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port: config.port }, "Server listening");
});

server.on("error", (error) => {
  logger.error({ err: error }, "Server error");
});
