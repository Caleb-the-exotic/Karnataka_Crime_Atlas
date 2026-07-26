import type { Request, Response } from "express";
import * as complaintService from "../services/complaint.service.js";
import type { ComplaintPriority, ComplaintStatus } from "@prisma/client";

// POST /api/v1/complaints
export async function create(req: Request, res: Response) {
  const complaint = await complaintService.createComplaint(req.body);
  res.status(201).json({ success: true, data: complaint });
}

// GET /api/v1/complaints
export async function list(req: Request, res: Response) {
  const { status, priority, districtId, search, page, limit } = req.query;
  const result = await complaintService.listComplaints({
    status: status as ComplaintStatus | undefined,
    priority: priority as ComplaintPriority | undefined,
    districtId: districtId ? Number(districtId) : undefined,
    search: search as string | undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  res.json({ success: true, ...result });
}

// GET /api/v1/complaints/:id
export async function getById(req: Request, res: Response) {
  const complaint = await complaintService.getComplaintById(Number(req.params.id));
  res.json({ success: true, data: complaint });
}

// PATCH /api/v1/complaints/:id
export async function update(req: Request, res: Response) {
  const complaint = await complaintService.updateComplaint(Number(req.params.id), req.body);
  res.json({ success: true, data: complaint });
}

// DELETE /api/v1/complaints/:id
export async function softDelete(req: Request, res: Response) {
  await complaintService.deleteComplaint(Number(req.params.id));
  res.json({ success: true, message: "Complaint deleted" });
}

// POST /api/v1/complaints/:id/assign
export async function assign(req: Request, res: Response) {
  const { officerId, assignedBy } = req.body;
  const complaint = await complaintService.assignOfficer(
    Number(req.params.id),
    Number(officerId),
    assignedBy ?? "System"
  );
  res.json({ success: true, data: complaint });
}

// PATCH /api/v1/complaints/:id/status
export async function changeStatus(req: Request, res: Response) {
  const { status, changedBy, remarks } = req.body;
  const complaint = await complaintService.updateStatus(
    Number(req.params.id),
    status as ComplaintStatus,
    changedBy ?? "System",
    remarks
  );
  res.json({ success: true, data: complaint });
}

// GET /api/v1/complaints/:id/timeline
export async function timeline(req: Request, res: Response) {
  const result = await complaintService.getComplaintTimeline(Number(req.params.id));
  res.json({ success: true, data: result });
}

// POST /api/v1/complaints/:complaintId/evidence
export async function uploadEvidence(req: Request, res: Response) {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) {
    res.status(400).json({ error: "No files uploaded" });
    return;
  }
  const result = await complaintService.addEvidenceFiles(
    Number(req.params.complaintId),
    files.map((f) => ({
      filename: f.filename,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      path: f.path,
    }))
  );
  res.status(201).json({ success: true, data: result });
}
