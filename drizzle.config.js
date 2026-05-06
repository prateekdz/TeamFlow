import { defineConfig } from "drizzle-kit";
import config from "./src/config/index.js";

export default defineConfig({
  schema: "./src/models/schema/*.js",
  dialect: "postgresql",
  dbCredentials: {
    url: config.databaseUrl,
  },
});
