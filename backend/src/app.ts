import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import healthRoutes from "./routes/health.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import preferencesRoutes from "./routes/preferences.routes.js";
import jobsRoutes from "./routes/jobs.routes.js";
import applicationsRoutes from "./routes/applications.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import aiInsightsRoutes from "./routes/aiInsights.routes.js";
import monitoringRoutes from "./routes/monitoring.routes.js";
import { notFound } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());

app.use(helmet());

app.use(express.json());

app.use(cookieParser());

app.use(morgan("dev"));

app.use("/health", healthRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/preferences", preferencesRoutes);
app.use("/api/v1/jobs", jobsRoutes);
app.use("/api/v1/applications", applicationsRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/ai", aiInsightsRoutes);
app.use("/api/v1/monitoring", monitoringRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
