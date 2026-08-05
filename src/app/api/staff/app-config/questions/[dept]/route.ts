import { NextRequest, NextResponse } from "next/server";
import { getRoleLevel, getUserRolesFromHeaders } from "@/lib/permissions";
import { getApplyConfig } from "@/lib/apply.config";
import {
  FIELD_TYPES,
  canEditQuestions,
  diffQuestions,
  getDefaultQuestions,
  getQuestionsForDept,
  isApplicableSlug,
  isHighRank,
  updateQuestions,
  type QuestionDiff,
} from "@/lib/application-questions";
import { logStaffAction } from "@/lib/activity-log";
import type { ApplicationField } from "@/lib/applications.data";

function isAllowed(req: NextRequest, dept: string): boolean {
  const level = getRoleLevel(req.headers);
  if (isHighRank(level)) return true;
  const userId = req.headers.get("x-user-id") || "";
  const roles = getUserRolesFromHeaders(req.headers);
  return canEditQuestions(userId, roles, dept);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  if (!isApplicableSlug(dept)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }
  if (!isAllowed(req, dept)) {
    return NextResponse.json({ error: "You don't have permission to edit these questions" }, { status: 403 });
  }

  return NextResponse.json({
    dept,
    label: getApplyConfig(dept)?.label ?? dept,
    questions: getQuestionsForDept(dept),
    defaults: getDefaultQuestions(dept),
  });
}

function isValidQuestion(f: ApplicationField): string | null {
  if (!f.name || !String(f.name).trim()) return "Every question needs a name (key).";
  if (!f.label || !String(f.label).trim()) return `Question "${f.name}" needs a label.`;
  if (!(FIELD_TYPES as readonly string[]).includes(f.type)) return `Question "${f.name}" has an invalid type.`;
  if (f.type === "select") {
    if (!Array.isArray(f.options) || f.options.length === 0) {
      return `Question "${f.name}" is a select but has no options.`;
    }
    for (const o of f.options) {
      if (!String(o).trim()) return `Question "${f.name}" has an empty option.`;
    }
  }
  return null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  if (!isApplicableSlug(dept)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }
  if (!isAllowed(req, dept)) {
    return NextResponse.json({ error: "You don't have permission to edit these questions" }, { status: 403 });
  }

  const username = req.headers.get("x-user-name") || "";

  let body: { questions?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.questions;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: "At least one question is required" }, { status: 400 });
  }
  if (raw.length > 100) {
    return NextResponse.json({ error: "Too many questions (max 100)" }, { status: 400 });
  }

  const questions = raw as ApplicationField[];
  const seen = new Set<string>();
  for (const f of questions) {
    const err = isValidQuestion(f);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    const key = String(f.name).trim();
    if (seen.has(key)) return NextResponse.json({ error: `Duplicate question name: "${key}"` }, { status: 400 });
    seen.add(key);
  }

  const normalized: ApplicationField[] = questions.map((f) => ({
    name: String(f.name).trim(),
    label: String(f.label).trim(),
    type: f.type,
    required: !!f.required,
    placeholder: f.placeholder != null ? String(f.placeholder) : undefined,
    options: f.type === "select" ? (f.options || []).map((o) => String(o).trim()).filter(Boolean) : undefined,
  }));

  const before = getQuestionsForDept(dept);
  updateQuestions({ dept, questions: normalized, updatedBy: username });

  const diff: QuestionDiff = diffQuestions(before, normalized);
  logStaffAction({
    actorId: req.headers.get("x-user-id") || "",
    actorName: username,
    action: "application_questions_update",
    reason: `${getApplyConfig(dept)?.label ?? dept} questions updated`,
    metadata: {
      dept,
      deptLabel: getApplyConfig(dept)?.label ?? dept,
      added: diff.added.length,
      removed: diff.removed.length,
      changed: diff.changed.length,
      details: diff,
    },
  });

  return NextResponse.json({ success: true, diff });
}
