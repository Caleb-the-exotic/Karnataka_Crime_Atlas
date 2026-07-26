import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { complaintRouter } from "./routes/complaint.routes.js";
import { excelRouter } from "./routes/excel.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import { knowledgeRouter } from "./routes/knowledge.routes.js";

config(); // Load .env

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 4000);

const app = express();

// ── Security & Middleware ──────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:4173"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined", {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Static uploads ─────────────────────────────────────────────────────────
const uploadsDir = process.env.UPLOADS_DIR ?? "./uploads";
app.use("/uploads", express.static(path.resolve(__dirname, "..", uploadsDir)));

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CIAP Backend Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/v1/complaints", complaintRouter);
app.use("/api/v1/excel", excelRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/knowledge", knowledgeRouter);

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 CIAP Backend Server running on http://localhost:${PORT}`);
  logger.info(`📋 API base: http://localhost:${PORT}/api/v1`);
});

export default app;
