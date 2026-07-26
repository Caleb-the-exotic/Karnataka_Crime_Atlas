import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { createError } from "../middleware/error-handler.js";
import type { ComplaintPriority, ComplaintStatus } from "@prisma/client";

// Generate complaint number: CIAP-YYYY-XXXXXX
async function generateComplaintNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.complaint.count({
    where: { ComplaintNumber: { startsWith: `CIAP-${year}-` } },
  });
  return `CIAP-${year}-${String(count + 1).padStart(6, "0")}`;
}

// ── Create ────────────────────────────────────────────────────────────────
export async function createComplaint(data: {
  citizenName: string;
  phoneNumber: string;
  email?: string;
  gender?: string;
  age?: number;
  districtId?: number;
  policeStationId?: number;
  incidentDate?: string;
  incidentAddress?: string;
  latitude?: number;
  longitude?: number;
  complaintCategory: string;
  subject: string;
  description: string;
  priority?: ComplaintPriority;
}) {
  const complaintNumber = await generateComplaintNumber();

  const complaint = await prisma.complaint.create({
    data: {
      ComplaintNumber: complaintNumber,
      CitizenName: data.citizenName,
      PhoneNumber: data.phoneNumber,
      Email: data.email,
      Gender: data.gender,
      Age: data.age,
      DistrictID: data.districtId,
      PoliceStationID: data.policeStationId,
      IncidentDate: data.incidentDate ? new Date(data.incidentDate) : undefined,
      IncidentAddress: data.incidentAddress,
      Latitude: data.latitude,
      Longitude: data.longitude,
      ComplaintCategory: data.complaintCategory,
      Subject: data.subject,
      Description: data.description,
      Priority: data.priority ?? "NORMAL",
      Status: "SUBMITTED",
      StatusHistory: {
        create: {
          ToStatus: "SUBMITTED",
          ChangedBy: data.citizenName,
          Remarks: "Complaint submitted by citizen",
        },
      },
    },
    include: {
      District: true,
      PoliceStation: true,
      StatusHistory: { orderBy: { ChangedAt: "desc" }, take: 1 },
    },
  });

  logger.info(`Complaint created: ${complaintNumber} by ${data.citizenName}`);
  return complaint;
}

// ── List ──────────────────────────────────────────────────────────────────
export async function listComplaints(filters: {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  districtId?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    DeletedAt: null,
    ...(filters.status && { Status: filters.status }),
    ...(filters.priority && { Priority: filters.priority }),
    ...(filters.districtId && { DistrictID: filters.districtId }),
    ...(filters.search && {
      OR: [
        { ComplaintNumber: { contains: filters.search, mode: "insensitive" as const } },
        { CitizenName: { contains: filters.search, mode: "insensitive" as const } },
        { Subject: { contains: filters.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [complaints, total] = await prisma.$transaction([
    prisma.complaint.findMany({
      where,
      skip,
      take: limit,
      orderBy: { CreatedAt: "desc" },
      include: {
        District: { select: { DistrictName: true } },
        AssignedOfficer: { select: { FirstName: true, LastName: true, EmployeeNumber: true } },
        EvidenceFiles: { select: { EvidenceID: true, FileName: true, MimeType: true } },
      },
    }),
    prisma.complaint.count({ where }),
  ]);

  return {
    complaints,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

// ── Get Single ────────────────────────────────────────────────────────────
export async function getComplaintById(id: number) {
  const complaint = await prisma.complaint.findFirst({
    where: { ComplaintID: id, DeletedAt: null },
    include: {
      District: true,
      PoliceStation: true,
      AssignedOfficer: { select: { EmployeeID: true, FirstName: true, LastName: true, EmployeeNumber: true, PhoneNumber: true } },
      StatusHistory: { orderBy: { ChangedAt: "desc" } },
      EvidenceFiles: true,
    },
  });
  if (!complaint) throw createError("Complaint not found", 404);
  return complaint;
}

// ── Update ────────────────────────────────────────────────────────────────
export async function updateComplaint(id: number, data: Partial<{
  subject: string;
  description: string;
  priority: ComplaintPriority;
  incidentAddress: string;
  incidentDate: string;
  latitude: number;
  longitude: number;
  remarks: string;
}>) {
  const existing = await prisma.complaint.findFirst({ where: { ComplaintID: id, DeletedAt: null } });
  if (!existing) throw createError("Complaint not found", 404);
  if (existing.Status === "CLOSED" || existing.Status === "REJECTED") {
    throw createError("Cannot update a closed or rejected complaint", 400);
  }

  return prisma.complaint.update({
    where: { ComplaintID: id },
    data: {
      Subject: data.subject,
      Description: data.description,
      Priority: data.priority,
      IncidentAddress: data.incidentAddress,
      IncidentDate: data.incidentDate ? new Date(data.incidentDate) : undefined,
      Latitude: data.latitude,
      Longitude: data.longitude,
      Remarks: data.remarks,
    },
  });
}

// ── Assign Officer ────────────────────────────────────────────────────────
export async function assignOfficer(id: number, officerId: number, assignedBy: string) {
  const complaint = await prisma.complaint.findFirst({ where: { ComplaintID: id, DeletedAt: null } });
  if (!complaint) throw createError("Complaint not found", 404);

  const officer = await prisma.employee.findUnique({ where: { EmployeeID: officerId } });
  if (!officer) throw createError("Officer not found", 404);

  const previousStatus = complaint.Status;

  return prisma.complaint.update({
    where: { ComplaintID: id },
    data: {
      AssignedOfficerID: officerId,
      Status: "ASSIGNED",
      StatusHistory: {
        create: {
          FromStatus: previousStatus,
          ToStatus: "ASSIGNED",
          ChangedBy: assignedBy,
          Remarks: `Assigned to ${officer.FirstName} ${officer.LastName} (${officer.EmployeeNumber})`,
        },
      },
    },
    include: {
      AssignedOfficer: { select: { FirstName: true, LastName: true, EmployeeNumber: true } },
    },
  });
}

// ── Update Status ─────────────────────────────────────────────────────────
export async function updateStatus(
  id: number,
  newStatus: ComplaintStatus,
  changedBy: string,
  remarks?: string
) {
  const complaint = await prisma.complaint.findFirst({ where: { ComplaintID: id, DeletedAt: null } });
  if (!complaint) throw createError("Complaint not found", 404);

  const terminalStatuses: ComplaintStatus[] = ["CLOSED", "REJECTED"];
  if (terminalStatuses.includes(complaint.Status)) {
    throw createError(`Complaint is already ${complaint.Status} and cannot be changed`, 400);
  }

  logger.info(`Complaint ${id} status: ${complaint.Status} -> ${newStatus} by ${changedBy}`);

  return prisma.complaint.update({
    where: { ComplaintID: id },
    data: {
      Status: newStatus,
      StatusHistory: {
        create: {
          FromStatus: complaint.Status,
          ToStatus: newStatus,
          ChangedBy: changedBy,
          Remarks: remarks,
        },
      },
    },
  });
}

// ── Get Timeline ──────────────────────────────────────────────────────────
export async function getComplaintTimeline(id: number) {
  const timeline = await prisma.complaintStatusHistory.findMany({
    where: { ComplaintID: id },
    orderBy: { ChangedAt: "asc" },
  });
  if (!timeline.length) throw createError("No timeline found for this complaint", 404);
  return timeline;
}

// ── Soft Delete ───────────────────────────────────────────────────────────
export async function deleteComplaint(id: number) {
  const existing = await prisma.complaint.findFirst({ where: { ComplaintID: id, DeletedAt: null } });
  if (!existing) throw createError("Complaint not found", 404);
  return prisma.complaint.update({
    where: { ComplaintID: id },
    data: { DeletedAt: new Date() },
  });
}

// ── Add Evidence Files ─────────────────────────────────────────────────────
export async function addEvidenceFiles(
  complaintId: number,
  files: Array<{
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  }>
) {
  const complaint = await prisma.complaint.findFirst({ where: { ComplaintID: complaintId, DeletedAt: null } });
  if (!complaint) throw createError("Complaint not found", 404);

  return prisma.complaintEvidence.createMany({
    data: files.map((f) => ({
      ComplaintID: complaintId,
      FileName: f.filename,
      OriginalName: f.originalname,
      MimeType: f.mimetype,
      FileSize: BigInt(f.size),
      StoragePath: f.path,
    })),
  });
}
