import compression from "compression";
import cors from "cors";
import { randomUUID } from "crypto";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { getEnvironmentVariables } from "./common/environment";
import { rateLimiter } from "./middlewares/rateLimiter";
import { authRouter } from "./modules/Auth/route";
import { moodRouter } from "./modules/Mood/route";
import { setupMooDuckTelegramBot } from "./modules/TelegramBot";

export const app = express();

app.set("trust proxy", 1);

const SERVER_TIMEOUT = 30000;
const { port, isDev } = getEnvironmentVariables();

/**
 * App middlewares
 **/

// CORS settings
app.use(
  cors({
    origin: isDev ? "*" : ["https://shrek-labs.ru", "https://mooduck.shrek-labs.ru"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
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
  })
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
  })
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

setupMooDuckTelegramBot(app);

app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));

app.use("/api/auth", authRouter);
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

const server = app
  .listen(port, "0.0.0.0", (error) => {
    if (error) {
      console.log("Server error!", error);
    }

    console.log(`
    🚀 Server running in ${isDev ? "development" : "PRODUCTION"} mode
    📡 Listening on port ${port}
    🕐 ${new Date().toISOString()}
  `);
  })
  .on("error", (error) => {
    console.error("Server failed to start:", error);
  });

server.setTimeout(SERVER_TIMEOUT);
server.keepAliveTimeout = 65000; // Helps with load balancers
server.headersTimeout = 66000; // Just slightly longer

/**
 * Graceful shutdown
 **/

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");

  server.close(() => {
    console.log("Process terminated");
  });
});
