import { Router } from "express";
import type { Request, Response } from "express";
import * as searchService from "../services/search.service.js";

export const searchRouter = Router();

/** GET /api/v1/search?q=<query> — global multi-entity search */
searchRouter.get("/", async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 2) { res.status(400).json({ error: "Query too short" }); return; }
  const result = await searchService.globalSearch(q, Number(req.query.limit ?? 30));
  res.json({ success: true, ...result });
});

/** GET /api/v1/search/case/:firNumber — FIR/case lookup */
searchRouter.get("/case/:firNumber", async (req: Request, res: Response) => {
  const result = await searchService.lookupCase(String(req.params.firNumber));
  if (!result) { res.status(404).json({ error: "Case not found" }); return; }
  res.json({ success: true, data: result });
});

/** GET /api/v1/search/suspect?name=<name> — suspect/accused search */
searchRouter.get("/suspect", async (req: Request, res: Response) => {
  const name = String(req.query.name ?? "").trim();
  if (!name) { res.status(400).json({ error: "name query param required" }); return; }
  const result = await searchService.lookupSuspect(name);
  res.json({ success: true, data: result });
});

/** GET /api/v1/search/victim?name=<name> — victim search */
searchRouter.get("/victim", async (req: Request, res: Response) => {
  const name = String(req.query.name ?? "").trim();
  if (!name) { res.status(400).json({ error: "name query param required" }); return; }
  const result = await searchService.lookupVictim(name);
  res.json({ success: true, data: result });
});

/** GET /api/v1/search/station?q=<query>&districtId=<id> — police station search */
searchRouter.get("/station", async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) { res.status(400).json({ error: "q query param required" }); return; }
  const result = await searchService.lookupPoliceStation(
    q,
    req.query.districtId ? Number(req.query.districtId) : undefined
  );
  res.json({ success: true, data: result });
});

/** GET /api/v1/search/district?name=<name> — district lookup */
searchRouter.get("/district", async (req: Request, res: Response) => {
  const name = String(req.query.name ?? "").trim();
  if (!name) { res.status(400).json({ error: "name query param required" }); return; }
  const result = await searchService.lookupDistrict(name);
  res.json({ success: true, data: result });
});

/** GET /api/v1/search/act?q=<query> — Act and Section search */
searchRouter.get("/act", async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) { res.status(400).json({ error: "q query param required" }); return; }
  const result = await searchService.lookupActSection(q);
  res.json({ success: true, ...result });
});
