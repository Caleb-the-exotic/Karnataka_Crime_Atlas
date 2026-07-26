import type { Request, Response } from "express";
import * as excelService from "../services/excel.service.js";

// POST /api/v1/excel/upload
export async function upload(req: Request, res: Response) {
  const file = req.file as Express.Multer.File;
  if (!file) { res.status(400).json({ error: "No file uploaded" }); return; }
  const importedBy = req.body.importedBy ?? "System";
  const isReImport = req.body.isReImport === "true";

  const batch = await excelService.createImportBatch(file, importedBy, isReImport);
  // Run import asynchronously so upload endpoint returns immediately
  excelService.importExcelFile(batch.BatchID, file.path).catch(console.error);

  res.status(202).json({
    success: true,
    message: "File uploaded. Import started in background.",
    data: { batchId: batch.BatchID, originalName: file.originalname },
  });
}

// GET /api/v1/excel/history
export async function history(req: Request, res: Response) {
  const { page, limit } = req.query;
  const result = await excelService.getImportHistory(Number(page ?? 1), Number(limit ?? 20));
  res.json({ success: true, ...result });
}

// GET /api/v1/excel/:batchId/logs
export async function logs(req: Request, res: Response) {
  const result = await excelService.getBatchLogs(Number(req.params.batchId));
  res.json({ success: true, ...result });
}

// POST /api/v1/excel/:batchId/reimport
export async function reimport(req: Request, res: Response) {
  const { batch } = await excelService.getBatchLogs(Number(req.params.batchId));
  const file = {
    filename: batch.FileName,
    originalname: batch.OriginalName,
    mimetype: batch.MimeType,
    size: Number(batch.FileSizeBytes),
    path: batch.StoragePath,
  } as Express.Multer.File;

  const newBatch = await excelService.createImportBatch(file, req.body.importedBy ?? "System", true);
  excelService.importExcelFile(newBatch.BatchID, batch.StoragePath).catch(console.error);

  res.status(202).json({
    success: true,
    message: "Re-import started in background.",
    data: { batchId: newBatch.BatchID },
  });
}
