import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CIAP database...");

  // ── State ──────────────────────────────────────────────────────────────
  const karnataka = await prisma.state.upsert({
    where: { StateName: "Karnataka" },
    update: {},
    create: { StateName: "Karnataka", StateCode: "KA" },
  });
  console.log("✅ State: Karnataka");

  // ── Districts ──────────────────────────────────────────────────────────
  const districtNames = [
    "Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Mandya", "Hassan", "Chamarajanagar", "Kodagu",
    "Mangaluru", "Dakshina Kannada", "Udupi", "Uttara Kannada", "Chikkamagaluru",
    "Shivamogga", "Davanagere", "Haveri", "Chitradurga",
    "Hubballi-Dharwad", "Belagavi", "Bagalkot", "Vijayapur", "Dharwad", "Gadag",
    "Kalaburagi", "Bidar", "Yadgir", "Raichur", "Koppal", "Ballari", "Vijayanagara",
    "Tumakuru", "Kolar", "Chickballapura",
  ];

  for (const name of districtNames) {
    const code = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
    await prisma.district.upsert({
      where: { StateID_DistrictCode: { StateID: karnataka.StateID, DistrictCode: code } },
      update: {},
      create: { StateID: karnataka.StateID, DistrictName: name, DistrictCode: code },
    });
  }
  console.log(`✅ Districts: ${districtNames.length}`);

  // ── Unit Types ─────────────────────────────────────────────────────────
  const unitTypes = ["Commissionerate", "City Police", "District Police", "Range", "Railway Police", "Traffic Police"];
  for (const name of unitTypes) {
    await prisma.unitType.upsert({
      where: { UnitTypeName: name },
      update: {},
      create: { UnitTypeName: name },
    });
  }
  console.log("✅ Unit Types");

  // ── Ranks ──────────────────────────────────────────────────────────────
  const ranks = [
    { code: "DGP", name: "Director General of Police", priority: 1 },
    { code: "ADGP", name: "Additional Director General of Police", priority: 2 },
    { code: "IGP", name: "Inspector General of Police", priority: 3 },
    { code: "DIG", name: "Deputy Inspector General of Police", priority: 4 },
    { code: "SP", name: "Superintendent of Police", priority: 5 },
    { code: "ASP", name: "Assistant Superintendent of Police", priority: 6 },
    { code: "DSP", name: "Deputy Superintendent of Police", priority: 7 },
    { code: "PI", name: "Police Inspector", priority: 8 },
    { code: "PSI", name: "Police Sub-Inspector", priority: 9 },
    { code: "ASI", name: "Assistant Sub-Inspector", priority: 10 },
    { code: "HC", name: "Head Constable", priority: 11 },
    { code: "PC", name: "Police Constable", priority: 12 },
  ];
  for (const r of ranks) {
    await prisma.rank.upsert({
      where: { RankCode: r.code },
      update: {},
      create: { RankName: r.name, RankCode: r.code, Priority: r.priority },
    });
  }
  console.log("✅ Ranks");

  // ── Designations ───────────────────────────────────────────────────────
  const desigs = ["Station House Officer", "Investigation Officer", "Crime Branch Officer", "Traffic Warden", "Beat Officer", "Court Duty Officer"];
  for (const d of desigs) {
    await prisma.designation.upsert({
      where: { DesignationName: d },
      update: {},
      create: { DesignationName: d },
    });
  }
  console.log("✅ Designations");

  // ── Case Status Master ─────────────────────────────────────────────────
  const statuses = [
    { code: "PENDING_INVESTIGATION", name: "Pending Investigation" },
    { code: "UNDER_INVESTIGATION", name: "Under Investigation" },
    { code: "CHARGESHEET_FILED", name: "Charge Sheet Filed" },
    { code: "COURT_TRIAL", name: "Under Court Trial" },
    { code: "CONVICTED", name: "Convicted" },
    { code: "ACQUITTED", name: "Acquitted" },
    { code: "COMPOUNDED", name: "Compounded" },
    { code: "MISTAKE_OF_FACT", name: "Mistake of Fact" },
    { code: "UNDETECTED", name: "Undetected" },
    { code: "CLOSED", name: "Closed" },
  ];
  for (const s of statuses) {
    await prisma.caseStatusMaster.upsert({
      where: { StatusCode: s.code },
      update: {},
      create: { StatusCode: s.code, StatusName: s.name },
    });
  }
  console.log("✅ Case Status Master");

  // ── Case Categories ────────────────────────────────────────────────────
  const categories = [
    { code: "IPC", name: "IPC/BNS Crime" },
    { code: "SLL", name: "Special & Local Laws" },
    { code: "WOMEN", name: "Crime Against Women" },
    { code: "CHILDREN", name: "Crime Against Children" },
    { code: "SCST", name: "Crime Against SC/ST" },
    { code: "CYBER", name: "Cyber Crime" },
    { code: "NARCOTICS", name: "Narcotics/NDPS" },
    { code: "ECONOMIC", name: "Economic Offence" },
  ];
  for (const c of categories) {
    await prisma.caseCategory.upsert({
      where: { CategoryCode: c.code },
      update: {},
      create: { CategoryCode: c.code, CategoryName: c.name },
    });
  }
  console.log("✅ Case Categories");

  // ── Gravity Offences ───────────────────────────────────────────────────
  const gravities = [
    { level: "LOW", code: 1 },
    { level: "MEDIUM", code: 2 },
    { level: "HIGH", code: 3 },
    { level: "CRITICAL", code: 4 },
  ];
  for (const g of gravities) {
    await prisma.gravityOffence.upsert({
      where: { GravityLevel: g.level },
      update: {},
      create: { GravityLevel: g.level, GravityCode: g.code },
    });
  }
  console.log("✅ Gravity Offences");

  // ── Major Acts ─────────────────────────────────────────────────────────
  const acts = [
    { name: "Indian Penal Code, 1860", short: "IPC", year: 1860 },
    { name: "Bharatiya Nyaya Sanhita, 2023", short: "BNS", year: 2023 },
    { name: "Arms Act, 1959", short: "Arms Act", year: 1959 },
    { name: "Narcotic Drugs and Psychotropic Substances Act, 1985", short: "NDPS", year: 1985 },
    { name: "Prevention of Atrocities Act (SC/ST), 1989", short: "SC/ST PA Act", year: 1989 },
    { name: "Protection of Children from Sexual Offences Act, 2012", short: "POCSO", year: 2012 },
    { name: "Information Technology Act, 2000", short: "IT Act", year: 2000 },
    { name: "Immoral Traffic (Prevention) Act, 1956", short: "ITPA", year: 1956 },
  ];
  for (const a of acts) {
    await prisma.act.upsert({
      where: { ActName: a.name },
      update: {},
      create: { ActName: a.name, ActShortName: a.short, ActYear: a.year },
    });
  }
  console.log("✅ Acts (8 major acts seeded)");

  // ── Master Tables ──────────────────────────────────────────────────────
  const religions = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"];
  for (const r of religions) {
    await prisma.religionMaster.upsert({ where: { ReligionName: r }, update: {}, create: { ReligionName: r } });
  }
  console.log("✅ Religion Master");

  const castes = [
    { name: "Scheduled Caste", cat: "SC" }, { name: "Scheduled Tribe", cat: "ST" },
    { name: "Other Backward Class", cat: "OBC" }, { name: "General", cat: "GEN" },
  ];
  for (const c of castes) {
    await prisma.casteMaster.upsert({ where: { CasteName: c.name }, update: {}, create: { CasteName: c.name, Category: c.cat } });
  }
  console.log("✅ Caste Master");

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
