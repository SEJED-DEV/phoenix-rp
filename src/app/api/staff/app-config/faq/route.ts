import { NextRequest, NextResponse } from "next/server";
import { getRoleLevel } from "@/lib/permissions";
import { isHighRank } from "@/lib/application-questions";
import { DEFAULT_FAQS, diffFaqs, getFaqs, updateFaqs, type Faq } from "@/lib/faq.config";
import { logStaffAction } from "@/lib/activity-log";

function isAllowed(req: NextRequest): boolean {
  return isHighRank(getRoleLevel(req.headers));
}

export async function GET(req: NextRequest) {
  if (!isAllowed(req)) {
    return NextResponse.json({ error: "Only Management & Owner can edit the FAQ" }, { status: 403 });
  }
  return NextResponse.json({ faqs: getFaqs(), defaults: DEFAULT_FAQS });
}

export async function PUT(req: NextRequest) {
  if (!isAllowed(req)) {
    return NextResponse.json({ error: "Only Management & Owner can edit the FAQ" }, { status: 403 });
  }

  const username = req.headers.get("x-user-name") || "";

  let body: { faqs?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.faqs;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "faqs array is required" }, { status: 400 });
  }
  if (raw.length === 0) {
    return NextResponse.json({ error: "At least one FAQ is required" }, { status: 400 });
  }
  if (raw.length > 200) {
    return NextResponse.json({ error: "Too many FAQs (max 200)" }, { status: 400 });
  }

  const faqs: Faq[] = raw.map((f) => ({
    q: String((f as { q?: unknown })?.q ?? "").trim(),
    a: String((f as { a?: unknown })?.a ?? "").trim(),
  }));

  for (const f of faqs) {
    if (!f.q) return NextResponse.json({ error: "Every FAQ needs a question." }, { status: 400 });
    if (!f.a) return NextResponse.json({ error: `FAQ "${f.q}" needs an answer.` }, { status: 400 });
  }

  const before = getFaqs();
  updateFaqs({ faqs, updatedBy: username });

  const diff = diffFaqs(before, faqs);
  logStaffAction({
    actorId: req.headers.get("x-user-id") || "",
    actorName: username,
    action: "faq_update",
    reason: "FAQ questions updated",
    metadata: {
      added: diff.added,
      removed: diff.removed,
      changed: diff.changed,
      details: diff.details,
    },
  });

  return NextResponse.json({ success: true, diff });
}
