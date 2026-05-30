import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import healthRoutes from "./routes/health.routes.js";

const app = express();

app.use(cors());

app.use(helmet());

app.use(express.json());

app.use(cookieParser());

app.use(morgan("dev"));

app.use("/health", healthRoutes);

export default app;