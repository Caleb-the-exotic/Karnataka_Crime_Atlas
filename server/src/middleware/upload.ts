import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const uploadsDir = process.env.UPLOADS_DIR ?? "./uploads";

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Excel Upload Storage ──────────────────────────────────────────────────
const excelStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.resolve(uploadsDir, "excel");
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const excelUpload = multer({
  storage: excelStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (allowed.includes(file.mimetype) || /\.(xlsx|xls)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Only .xlsx and .xls files are allowed."));
    }
  },
});

// ── Evidence Upload Storage ───────────────────────────────────────────────
const evidenceStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const complaintId = String(req.params.complaintId ?? "misc");
    const dir = path.resolve(uploadsDir, "evidence", complaintId);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const evidenceUpload = multer({
  storage: evidenceStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "video/mp4", "video/quicktime", "video/avi",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Allowed: images, videos, PDFs, documents."));
    }
  },
});
