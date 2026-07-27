import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

// Security
app.use(helmet());

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// HTTP request logger
app.use(morgan("dev"));

// Root API route
app.use("/uploads", express.static("uploads"));
app.use("/api", routes);

// Error handling middleware
app.use(errorMiddleware);

export default app;