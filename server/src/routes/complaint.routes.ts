import { Router } from "express";
import * as controller from "../controllers/complaint.controller.js";
import { evidenceUpload } from "../middleware/upload.js";

export const complaintRouter = Router();

/**
 * @route   POST /api/v1/complaints
 * @desc    Create a new complaint
 * @body    { citizenName, phoneNumber, email, gender, age, districtId, policeStationId,
 *            incidentDate, incidentAddress, latitude, longitude, complaintCategory,
 *            subject, description, priority? }
 */
complaintRouter.post("/", controller.create);

/**
 * @route   GET /api/v1/complaints
 * @desc    List complaints with filters
 * @query   status, priority, districtId, search, page, limit
 */
complaintRouter.get("/", controller.list);

/**
 * @route   GET /api/v1/complaints/:id
 * @desc    Get a single complaint by ID
 */
complaintRouter.get("/:id", controller.getById);

/**
 * @route   PATCH /api/v1/complaints/:id
 * @desc    Update complaint content (subject, description, etc.)
 */
complaintRouter.patch("/:id", controller.update);

/**
 * @route   DELETE /api/v1/complaints/:id
 * @desc    Soft-delete a complaint
 */
complaintRouter.delete("/:id", controller.softDelete);

/**
 * @route   POST /api/v1/complaints/:id/assign
 * @desc    Assign an officer to the complaint
 * @body    { officerId: number, assignedBy: string }
 */
complaintRouter.post("/:id/assign", controller.assign);

/**
 * @route   PATCH /api/v1/complaints/:id/status
 * @desc    Update complaint status with history
 * @body    { status: ComplaintStatus, changedBy: string, remarks?: string }
 */
complaintRouter.patch("/:id/status", controller.changeStatus);

/**
 * @route   GET /api/v1/complaints/:id/timeline
 * @desc    Get full status change timeline
 */
complaintRouter.get("/:id/timeline", controller.timeline);

/**
 * @route   POST /api/v1/complaints/:complaintId/evidence
 * @desc    Upload evidence files (images, videos, PDFs, documents)
 */
complaintRouter.post(
  "/:complaintId/evidence",
  evidenceUpload.array("files", 10),
  controller.uploadEvidence
);
