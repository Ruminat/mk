import compression from "compression";
import cors from "cors";
import { randomUUID } from "crypto";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { getEnvironmentVariables } from "./common/config/environment";
import { rateLimiter } from "./middlewares/rateLimiter";
import { adminRouter } from "./modules/Admin/route";
import { authRouter } from "./modules/Auth/route";
import { moodRouter } from "./modules/Mood/route";
import { setupMooDuckTelegramBot } from "./modules/TelegramBot";

export const app = express();

app.set("trust proxy", 1);

const SERVER_TIMEOUT = 30000;
const { port, isDev, useLocalDb } = getEnvironmentVariables();

/**
 * App middlewares
 **/

// CORS settings
app.use(
  cors({
    origin: isDev ? "*" : ["https://shrek-labs.ru", "https://mooduck.shrek-labs.ru"],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Rate limiter
app.use(rateLimiter.default);
app.use("/api/auth", rateLimiter.auth);

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

// No cache for api calls
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

/**
 * App routes
 **/

app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/mood", moodRouter);

/**
 * 404 error handling
 **/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

/**
 * In case of an uncaught error
 **/

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    message: isDev ? error.message : "Internal server error",
    ...(isDev && { stack: error.stack }),
  });
});

/**
 * Starting the server
 **/

let isShuttingDown = false;

async function bootstrap() {
  const telegramLifecycle = await setupMooDuckTelegramBot(app);

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
