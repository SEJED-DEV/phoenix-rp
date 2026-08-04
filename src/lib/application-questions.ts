import { getDb } from "./db";
import { getApplyConfig, APPLICATION_SLUGS } from "./apply.config";
import {
  APPLICATION_DEPARTMENTS,
  STAFF_APPLICATIONS,
  WHITELIST_FIELDS,
  APPEAL_FIELDS,
  type ApplicationField,
} from "./applications.data";

export const FIELD_TYPES = ["text", "textarea", "number", "select"] as const;
export type QuestionType = (typeof FIELD_TYPES)[number];

export interface QuestionRow {
  id: number;
  dept: string;
  questionKey: string;
  label: string;
  type: string;
  required: number;
  placeholder: string | null;
  options: string | null;
  position: number;
  updatedBy: string | null;
  updatedAt: string;
}

export interface EditorRow {
  dept: string;
  granteeType: string;
  granteeId: string;
  granteeName: string;
  grantedBy: string;
  grantedByUser: string;
  grantedAt: string;
}

export function isApplicableSlug(slug: string): boolean {
  return APPLICATION_SLUGS.includes(slug);
}

export function getDeptLabel(slug: string): string {
  return getApplyConfig(slug)?.label ?? slug;
}

export function isHighRank(roleLevel: string): boolean {
  return roleLevel === "management" || roleLevel === "owner";
}

export function getDefaultQuestions(slug: string): ApplicationField[] {
  if (slug === "whitelist") return WHITELIST_FIELDS;
  if (slug === "ban-appeal") return APPEAL_FIELDS;
  if (slug.startsWith("staff_")) {
    const s = STAFF_APPLICATIONS.find((x) => x.slug === slug.replace("staff_", ""));
    if (s) return s.fields;
    return [];
  }
  const d = APPLICATION_DEPARTMENTS.find((x) => x.slug === slug);
  if (d) return d.fields;
  return [];
}

function isFieldType(value: string): value is QuestionType {
  return (FIELD_TYPES as readonly string[]).includes(value);
}

function rowToField(row: QuestionRow): ApplicationField {
  return {
    name: row.questionKey,
    label: row.label,
    type: isFieldType(row.type) ? row.type : "text",
    required: row.required === 1,
    placeholder: row.placeholder ?? undefined,
    options: row.options ? (JSON.parse(row.options) as string[]) : undefined,
  };
}

export function rowsToFields(rows: QuestionRow[]): ApplicationField[] {
  return rows.map(rowToField);
}

function seedIfEmpty(dept: string): void {
  const db = getDb();
  const count = db
    .prepare("SELECT COUNT(*) as c FROM application_questions WHERE dept = ?")
    .get(dept) as { c: number };
  if (count.c > 0) return;

  const defaults = getDefaultQuestions(dept);
  if (defaults.length === 0) return;

  const insert = db.prepare(`
    INSERT INTO application_questions (dept, questionKey, label, type, required, placeholder, options, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    defaults.forEach((f, i) => {
      insert.run(
        dept,
        f.name,
        f.label,
        f.type,
        f.required ? 1 : 0,
        f.placeholder ?? null,
        f.options && f.options.length ? JSON.stringify(f.options) : null,
        i,
      );
    });
  });
  tx();
}

export function getRawQuestions(dept: string): QuestionRow[] {
  seedIfEmpty(dept);
  const db = getDb();
  return db
    .prepare("SELECT * FROM application_questions WHERE dept = ? ORDER BY position ASC")
    .all(dept) as QuestionRow[];
}

export function getQuestionsForDept(dept: string): ApplicationField[] {
  return rowsToFields(getRawQuestions(dept));
}

export function getLabelsForDept(dept: string): Record<string, string> {
  return Object.fromEntries(getQuestionsForDept(dept).map((f) => [f.name, f.label]));
}

// ─── Editor grants ───

export function getEditorsForDept(dept: string): EditorRow[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM application_question_editors WHERE dept = ? ORDER BY grantedAt DESC")
    .all(dept) as EditorRow[];
}

export function getAllEditors(): Record<string, EditorRow[]> {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM application_question_editors ORDER BY dept, grantedAt DESC")
    .all() as EditorRow[];
  const map: Record<string, EditorRow[]> = {};
  for (const r of rows) {
    if (!map[r.dept]) map[r.dept] = [];
    map[r.dept].push(r);
  }
  return map;
}

export function addEditor(opts: {
  dept: string;
  granteeType: "member" | "role";
  granteeId: string;
  granteeName: string;
  grantedBy: string;
  grantedByUser: string;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO application_question_editors (dept, granteeType, granteeId, granteeName, grantedBy, grantedByUser, grantedAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(dept, granteeType, granteeId) DO UPDATE SET
      granteeName = excluded.granteeName,
      grantedBy = excluded.grantedBy,
      grantedByUser = excluded.grantedByUser,
      grantedAt = excluded.grantedAt
  `).run(
    opts.dept,
    opts.granteeType,
    opts.granteeId,
    opts.granteeName,
    opts.grantedBy,
    opts.grantedByUser,
  );
}

export function removeEditor(dept: string, granteeType: string, granteeId: string): void {
  const db = getDb();
  db.prepare(
    "DELETE FROM application_question_editors WHERE dept = ? AND granteeType = ? AND granteeId = ?"
  ).run(dept, granteeType, granteeId);
}

export function canEditQuestions(userId: string, userRoles: string[], dept: string): boolean {
  const editors = getEditorsForDept(dept);
  return editors.some((e) =>
    e.granteeType === "member" ? e.granteeId === userId : userRoles.includes(e.granteeId)
  );
}

// ─── Question updates ───

export function updateQuestions(opts: {
  dept: string;
  questions: ApplicationField[];
  updatedBy: string;
}): void {
  const db = getDb();
  const del = db.prepare("DELETE FROM application_questions WHERE dept = ?");
  const insert = db.prepare(`
    INSERT INTO application_questions (dept, questionKey, label, type, required, placeholder, options, position, updatedBy, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  const tx = db.transaction(() => {
    del.run(opts.dept);
    opts.questions.forEach((f, i) => {
      insert.run(
        opts.dept,
        f.name,
        f.label,
        f.type,
        f.required ? 1 : 0,
        f.placeholder ?? null,
        f.options && f.options.length ? JSON.stringify(f.options) : null,
        i,
        opts.updatedBy,
      );
    });
  });
  tx();
}

export interface QuestionDiff {
  added: { name: string; label: string }[];
  removed: { name: string; label: string }[];
  changed: { name: string; before: Partial<ApplicationField>; after: Partial<ApplicationField> }[];
}

function fieldSnapshot(f: ApplicationField): Partial<ApplicationField> {
  return {
    label: f.label,
    type: f.type,
    required: f.required,
    placeholder: f.placeholder,
    options: f.options,
  };
}

export function diffQuestions(before: ApplicationField[], after: ApplicationField[]): QuestionDiff {
  const beforeMap = new Map(before.map((f) => [f.name, f]));
  const afterMap = new Map(after.map((f) => [f.name, f]));
  const added: QuestionDiff["added"] = [];
  const removed: QuestionDiff["removed"] = [];
  const changed: QuestionDiff["changed"] = [];

  for (const f of after) {
    const prev = beforeMap.get(f.name);
    if (!prev) {
      added.push({ name: f.name, label: f.label });
    } else if (
      prev.label !== f.label ||
      prev.type !== f.type ||
      prev.required !== f.required ||
      prev.placeholder !== f.placeholder ||
      JSON.stringify(prev.options || []) !== JSON.stringify(f.options || [])
    ) {
      changed.push({ name: f.name, before: fieldSnapshot(prev), after: fieldSnapshot(f) });
    }
  }
  for (const f of before) {
    if (!afterMap.has(f.name)) removed.push({ name: f.name, label: f.label });
  }

  return { added, removed, changed };
}
