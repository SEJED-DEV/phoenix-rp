import { getDb } from "./db";
import { DEFAULT_FAQS, type Faq } from "./faq.defaults";

export { DEFAULT_FAQS, type Faq };

export interface FaqRow {
  id: number;
  question: string;
  answer: string;
  position: number;
  updatedBy: string | null;
  updatedAt: string;
}

export function getFaqs(): Faq[] {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) as c FROM faq_questions").get() as { c: number };
  if (count.c === 0) {
    const insert = db.prepare("INSERT INTO faq_questions (question, answer, position) VALUES (?, ?, ?)");
    const tx = db.transaction(() => {
      DEFAULT_FAQS.forEach((f, i) => insert.run(f.q, f.a, i));
    });
    tx();
  }
  const rows = db.prepare("SELECT * FROM faq_questions ORDER BY position ASC").all() as FaqRow[];
  return rows.map((r) => ({ q: r.question, a: r.answer }));
}

export function updateFaqs(opts: { faqs: Faq[]; updatedBy: string }): void {
  const db = getDb();
  const del = db.prepare("DELETE FROM faq_questions");
  const insert = db.prepare(`
    INSERT INTO faq_questions (question, answer, position, updatedBy, updatedAt)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);
  const tx = db.transaction(() => {
    del.run();
    opts.faqs.forEach((f, i) => insert.run(f.q, f.a, i, opts.updatedBy));
  });
  tx();
}

export interface FaqDiff {
  added: number;
  removed: number;
  changed: number;
  details: {
    added: { q: string }[];
    removed: { q: string }[];
    changed: { q: string }[];
  };
}

export function diffFaqs(before: Faq[], after: Faq[]): FaqDiff {
  const added: { q: string }[] = [];
  const removed: { q: string }[] = [];
  const changed: { q: string }[] = [];

  for (let i = 0; i < after.length; i++) {
    if (i >= before.length) {
      added.push({ q: after[i].q });
    } else if (before[i].q !== after[i].q || before[i].a !== after[i].a) {
      changed.push({ q: after[i].q });
    }
  }
  for (let i = after.length; i < before.length; i++) {
    removed.push({ q: before[i].q });
  }

  return {
    added: added.length,
    removed: removed.length,
    changed: changed.length,
    details: { added, removed, changed },
  };
}
