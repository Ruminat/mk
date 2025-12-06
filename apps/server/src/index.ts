import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { getEnvironmentVariables } from "./common/environment";
import { moodRouter } from "./modules/mood/route";

export const app = express();

const { port } = getEnvironmentVariables();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
});

app.use(cors());
app.use(morgan("tiny"));
app.use(limiter);
app.use(express.json());

// Health check
app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));

// App routes
app.use("/api/mood", moodRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// The server starts here
const server = app.listen(port, "0.0.0.0", (error) => {
  if (error) {
    console.log("Server error!", error);
  }

  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");

  server.close(() => {
    console.log("Process terminated");
  });
});
