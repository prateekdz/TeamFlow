import path from "node:path";
import process from "node:process";

const envFilePath = path.resolve(process.cwd(), ".env");

try {
  process.loadEnvFile(envFilePath);
} catch (error) {
  if (error?.code !== "ENOENT") {
    throw error;
  }
}

/**
 * Parse a port value from the environment.
 *
 * @param {string | undefined} rawPort
 * @param {number} fallbackPort
 * @returns {number}
 */
function parsePort(rawPort, fallbackPort) {
  if (!rawPort) {
    return fallbackPort;
  }

  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid port value: "${rawPort}"`);
  }

  return port;
}

/**
 * Return whether a Clerk env value looks like a real configured secret/key.
 *
 * @param {string | undefined} value
 * @returns {boolean}
 */
function isConfiguredSecret(value) {
  if (!value) {
    return false;
  }

  return !value.includes("your_key_here");
}

/**
 * Infer the runtime environment when a platform does not set NODE_ENV.
 *
 * Railway exposes platform-specific variables in production, so we treat
 * those deployments as production by default.
 *
 * @returns {string}
 */
function resolveRuntimeEnv() {
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PUBLIC_DOMAIN) {
    return "production";
  }

  return "development";
}

/**
 * Build the runtime configuration object for the application.
 *
 * @returns {{
 *   env: string;
 *   isProduction: boolean;
 *   port: number;
 *   clientPort: number;
 *   basePath: string;
 *   databaseUrl: string;
 *   logLevel: string;
 *   clerkPublishableKey: string | undefined;
 *   clerkSecretKey: string | undefined;
 *   clerkProxyUrl: string | undefined;
 *   clerkEnabled: boolean;
 *   publicDir: string;
 * }}
 */
export function createConfig() {
  const env = resolveRuntimeEnv();
  const publicDir = path.resolve(process.cwd(), "dist", "public");

  return {
    env,
    isProduction: env === "production",
    port: parsePort(process.env.PORT, 3000),
    clientPort: parsePort(process.env.CLIENT_PORT, 5173),
    basePath: process.env.BASE_PATH ?? "/",
    databaseUrl: process.env.DATABASE_URL ?? "",
    logLevel: process.env.LOG_LEVEL ?? "info",
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    clerkSecretKey: process.env.CLERK_SECRET_KEY,
    clerkProxyUrl: process.env.CLERK_PROXY_URL,
    clerkEnabled:
      isConfiguredSecret(process.env.CLERK_PUBLISHABLE_KEY) &&
      isConfiguredSecret(process.env.CLERK_SECRET_KEY),
    publicDir,
  };
}

const config = createConfig();

export default config;
