import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { rateLimit } from "./middleware/rateLimit.middleware.js";

const app = express();

// Security
app.use(helmet());

// Enable CORS with configured origins and vercel preview support
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://aastu-campus-navigator.vercel.app",
];

const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim().replace(/\/$/, ""))
  : [];

const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.has(cleanOrigin) || cleanOrigin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

// Parse JSON request bodies (100kb limit)
app.use(express.json({ limit: "100kb" }));

// HTTP request logger (suppress query logs in production)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiting for public API endpoints
app.use("/api/search", rateLimit(60_000, 30));
app.use("/api/chat", rateLimit(60_000, 20));
app.use("/api/navigation", rateLimit(60_000, 30));

// Root API route
app.use("/uploads", express.static("uploads"));
app.use("/api", routes);

// Error handling middleware
app.use(errorMiddleware);

export default app;