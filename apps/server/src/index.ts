import compression from "compression";
import { randomUUID } from "crypto";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { getEnvironmentVariables } from "./common/config/environment";
import { assertDatabaseReachable, closeDatabase } from "./db/client";
import { rateLimiter } from "./middlewares/rateLimiter";
import { setupMooDuckTelegramBot } from "./modules/TelegramBot";
import { registerWebApi } from "./modules/WebApi/registerWebApi";

export const app = express();

app.set("trust proxy", 1);

const SERVER_TIMEOUT = 30000;
const { port, isDev, useLocalDb } = getEnvironmentVariables();

/**
 * App middlewares
 **/

// No CORS: nothing calls this server from a browser. Telegram posts the webhook
// server-to-server, and the landing site is static and served by nginx.

// Rate limiter
app.use(rateLimiter);

// Adding X-Request-ID to every request, so we can always track them
app.use((req: Request & { id?: string }, res: Response, next) => {
  req.id = randomUUID();
  res.setHeader("X-Request-ID", req.id);
  next();
});

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);

// Compression
app.use(compression());

// Logs
app.use(morgan(":method :url :status :response-time ms - :req[id]"));

// JSON settings (protecting against large payload attacks)
app.use(
  express.json({
    limit: "16kb",
    type: "application/json",
  }),
);

/**
 * App routes
 *
 * Only these two: MooDuck is a Telegram bot, and the webhook route itself is
 * added by setupMooDuckTelegramBot() during bootstrap.
 **/

app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));

// NOTE: the 404 catch-all and error handler are registered inside bootstrap(),
// AFTER the Telegram webhook route is added — otherwise a webhook POST is
// swallowed by the catch-all (Express matches middleware in registration order).

/**
 * 404 + uncaught-error handlers. Registered last, after every route including
 * the Telegram webhook (added asynchronously by setupMooDuckTelegramBot).
 */
function registerFallbackHandlers() {
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
    });
  });

  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", error);

    res.status(500).json({
      success: false,
      message: isDev ? error.message : "Internal server error",
      ...(isDev && { stack: error.stack }),
    });
  });
}

/**
 * Starting the server
 **/

let isShuttingDown = false;

async function bootstrap() {
  // Fail here rather than on the first person to message the bot: everything the
  // bot does needs the database, so coming up without one only hides the problem.
  await assertDatabaseReachable();

  const telegramLifecycle = await setupMooDuckTelegramBot(app);

  // Mount the web API after the Telegram webhook and BEFORE the fallback handlers
  // below — Express matches in registration order, so an /api route registered
  // after the 404 catch-all would never be reached.
  registerWebApi(app);

  // Must come after the webhook route above, or webhook POSTs hit the 404.
  registerFallbackHandlers();

  const server = app
    .listen(port, "0.0.0.0", (error) => {
      if (error) {
        console.log("Server error!", error);
      }

      console.log(`
    🚀 Server running in ${isDev ? "development" : "PRODUCTION"} mode
    📡 Listening on port ${port}
    ${useLocalDb ? "💾 Using local SQLite database" : ""}
    🕐 ${new Date().toISOString()}
  `);
    })
    .on("error", (error) => {
      console.error("Server failed to start:", error);
    });

  server.setTimeout(SERVER_TIMEOUT);
  server.keepAliveTimeout = 65000; // Helps with load balancers
  server.headersTimeout = 66000; // Just slightly longer

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    console.log(`${signal} received. Shutting down gracefully...`);

    const forceExit = setTimeout(() => {
      console.error("Shutdown timed out, forcing exit");
      process.exit(0);
    }, 4000);

    try {
      await telegramLifecycle?.shutdownTelegram();
    } catch (error) {
      console.error("Telegram shutdown error:", error);
    }

    try {
      await closeDatabase();
    } catch (error) {
      console.error("Database shutdown error:", error);
    }

    // Without this, keep-alive HTTP sockets can keep the process alive for tens of seconds;
    // node --watch then sits on "Waiting for graceful termination..." and the new run may
    // bind the same port or load code in a bad state.
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }

    server.close((error) => {
      clearTimeout(forceExit);
      if (error) {
        console.error("Server close error:", error);
      }
      console.log("Process terminated");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => {
    if (isShuttingDown) {
      process.exit(0);
      return;
    }
    void shutdown("SIGTERM");
  });

  process.on("SIGINT", () => {
    if (isShuttingDown) {
      process.exit(0);
      return;
    }
    void shutdown("SIGINT");
  });
}

void bootstrap().catch((error) => {
  console.error("Bootstrap failed:", error);
  process.exit(1);
});
