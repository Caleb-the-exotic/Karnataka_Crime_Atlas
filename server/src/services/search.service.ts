import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

// ── Global Search ─────────────────────────────────────────────────────────
export async function globalSearch(query: string, limit = 30) {
  logger.info(`Global search: "${query}"`);
  const q = query.trim().toLowerCase();

  const [cases, suspects, victims, stations, knowledge] = await Promise.allSettled([
    // Case search
    prisma.caseMaster.findMany({
      where: {
        DeletedAt: null,
        OR: [
          { FIRNumber: { contains: query, mode: "insensitive" } },
          { NatureOfOffence: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      include: { Unit: { select: { UnitName: true } }, CrimeHead: { select: { CrimeHeadName: true } } },
    }),

    // Accused / suspect search
    prisma.accused.findMany({
      where: {
        OR: [
          { Name: { contains: query, mode: "insensitive" } },
          { Alias: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      include: { Case: { select: { FIRNumber: true } } },
    }),

    // Victim search
    prisma.victim.findMany({
      where: { Name: { contains: query, mode: "insensitive" } },
      take: limit,
      include: { Case: { select: { FIRNumber: true } } },
    }),

    // Police station search
    prisma.unit.findMany({
      where: {
        UnitName: { contains: query, mode: "insensitive" },
        IsActive: true,
      },
      take: limit,
      include: { District: { select: { DistrictName: true } } },
    }),

    // Knowledge records (AI data)
    prisma.knowledgeRecord.findMany({
      where: {
        OR: [
          { RawText: { contains: query, mode: "insensitive" } },
          { District: { contains: query, mode: "insensitive" } },
          { Category: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { UpdatedAt: "desc" },
    }),
  ]);

  return {
    query,
    results: {
      cases: cases.status === "fulfilled" ? cases.value : [],
      suspects: suspects.status === "fulfilled" ? suspects.value : [],
      victims: victims.status === "fulfilled" ? victims.value : [],
      policeStations: stations.status === "fulfilled" ? stations.value : [],
      knowledgeRecords: knowledge.status === "fulfilled" ? knowledge.value : [],
    },
  };
}

// ── Case Lookup ────────────────────────────────────────────────────────────
export async function lookupCase(firNumber: string) {
  return prisma.caseMaster.findFirst({
    where: { FIRNumber: firNumber, DeletedAt: null },
    include: {
      Unit: { select: { UnitName: true, District: { select: { DistrictName: true } } } },
      CrimeHead: true,
      CrimeSubHead: true,
      Category: true,
      Gravity: true,
      Status: true,
      InvestigatingOfficer: { select: { FirstName: true, LastName: true, EmployeeNumber: true } },
      Complainants: true,
      Victims: true,
      Accused: true,
      Arrests: true,
      ChargeSheets: { include: { Court: true } },
    },
  });
}

// ── Suspect Lookup ─────────────────────────────────────────────────────────
export async function lookupSuspect(name: string) {
  return prisma.accused.findMany({
    where: {
      OR: [
        { Name: { contains: name, mode: "insensitive" } },
        { Alias: { contains: name, mode: "insensitive" } },
      ],
    },
    include: {
      Case: {
        select: {
          FIRNumber: true,
          FIRDate: true,
          Unit: { select: { UnitName: true } },
          CrimeHead: { select: { CrimeHeadName: true } },
        },
      },
    },
    take: 50,
  });
}

// ── Victim Lookup ──────────────────────────────────────────────────────────
export async function lookupVictim(name: string) {
  return prisma.victim.findMany({
    where: { Name: { contains: name, mode: "insensitive" } },
    include: {
      Case: {
        select: {
          FIRNumber: true,
          FIRDate: true,
          Unit: { select: { UnitName: true } },
          CrimeHead: { select: { CrimeHeadName: true } },
        },
      },
    },
    take: 50,
  });
}

// ── Police Station Lookup ──────────────────────────────────────────────────
export async function lookupPoliceStation(query: string, districtId?: number) {
  return prisma.unit.findMany({
    where: {
      UnitName: { contains: query, mode: "insensitive" },
      IsActive: true,
      ...(districtId && { DistrictID: districtId }),
    },
    include: {
      District: { select: { DistrictName: true } },
      UnitType: { select: { UnitTypeName: true } },
    },
    take: 50,
  });
}

// ── District Lookup ─────────────────────────────────────────────────────────
export async function lookupDistrict(name: string) {
  return prisma.district.findMany({
    where: { DistrictName: { contains: name, mode: "insensitive" } },
    include: {
      State: true,
      Units: { where: { IsActive: true }, select: { UnitID: true, UnitName: true } },
    },
  });
}

// ── Act & Section Lookup ───────────────────────────────────────────────────
export async function lookupActSection(query: string) {
  const [acts, sections] = await Promise.all([
    prisma.act.findMany({
      where: { ActName: { contains: query, mode: "insensitive" }, IsActive: true },
      include: { Sections: { where: { IsActive: true }, take: 20 } },
      take: 20,
    }),
    prisma.section.findMany({
      where: {
        OR: [
          { SectionNumber: { contains: query, mode: "insensitive" } },
          { SectionTitle: { contains: query, mode: "insensitive" } },
        ],
        IsActive: true,
      },
      include: { Act: { select: { ActName: true, ActShortName: true } } },
      take: 30,
    }),
  ]);
  return { acts, sections };
}

// ── Knowledge Query (for AI chatbot context enrichment) ───────────────────
export async function queryKnowledge(query: string, limit = 10) {
  logger.info(`AI Knowledge query: "${query}"`);
  const records = await prisma.knowledgeRecord.findMany({
    where: {
      OR: [
        { RawText: { contains: query, mode: "insensitive" } },
        { District: { contains: query, mode: "insensitive" } },
        { Category: { contains: query, mode: "insensitive" } },
        { SubCategory: { contains: query, mode: "insensitive" } },
        { Tags: { has: query.toLowerCase() } },
      ],
    },
    orderBy: { UpdatedAt: "desc" },
    take: limit,
  });

  return records.map((r: { RawText: string }) => r.RawText).join("\n");
}
