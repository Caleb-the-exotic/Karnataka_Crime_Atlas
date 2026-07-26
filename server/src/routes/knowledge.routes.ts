import { Router } from "express";
import * as searchService from "../services/search.service.js";

export const knowledgeRouter = Router();

/**
 * @route   GET /api/v1/knowledge/query?q=<query>&limit=<n>
 * @desc    AI Knowledge Repository — returns structured text context for AI chatbot.
 *          The existing frontend AI service calls this endpoint to enrich LLM context
 *          with imported FIR records and Excel data before sending to Groq/OpenRouter.
 */
knowledgeRouter.get("/query", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const limit = Number(req.query.limit ?? 10);
  if (q.length < 2) { res.status(400).json({ error: "Query too short" }); return; }
  const context = await searchService.queryKnowledge(q, limit);
  res.json({ success: true, context, length: context.length });
});

/**
 * @route   GET /api/v1/knowledge/stats
 * @desc    Knowledge repository statistics
 */
knowledgeRouter.get("/stats", async (req, res) => {
  const { prisma } = await import("../lib/prisma.js");
  const [total, byType] = await Promise.all([
    prisma.knowledgeRecord.count(),
    prisma.knowledgeRecord.groupBy({
      by: ["RecordType"],
      _count: { RecordID: true },
    }),
  ]);
  res.json({
    success: true,
    data: {
      totalRecords: total,
      byType: byType.map((t) => ({ type: t.RecordType, count: t._count.RecordID })),
    },
  });
});
