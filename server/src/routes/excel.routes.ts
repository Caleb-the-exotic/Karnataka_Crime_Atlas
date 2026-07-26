import { Router } from "express";
import * as controller from "../controllers/excel.controller.js";
import { excelUpload } from "../middleware/upload.js";

export const excelRouter = Router();

/**
 * @route   POST /api/v1/excel/upload
 * @desc    Upload an Excel file and start import asynchronously
 * @body    multipart/form-data — file: .xlsx/.xls, importedBy: string, isReImport?: "true"/"false"
 * @returns 202 Accepted with batchId for polling
 */
excelRouter.post("/upload", excelUpload.single("file"), controller.upload);

/**
 * @route   GET /api/v1/excel/history
 * @desc    List all import batch history
 * @query   page, limit
 */
excelRouter.get("/history", controller.history);

/**
 * @route   GET /api/v1/excel/:batchId/logs
 * @desc    View logs for a specific import batch
 */
excelRouter.get("/:batchId/logs", controller.logs);

/**
 * @route   POST /api/v1/excel/:batchId/reimport
 * @desc    Re-import from the same uploaded file (incremental update)
 * @body    { importedBy?: string }
 */
excelRouter.post("/:batchId/reimport", controller.reimport);
