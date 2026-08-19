import { getDb } from "./db";
import crypto from "crypto";

export interface Ticket {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  type: string;
  subject: string;
  description: string;
  status: "open" | "in-progress" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo: string | null;
  assignedToUsername: string | null;
  userRole: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  messageId: string | null;
  uploaderId: string;
  uploaderName: string;
  fileName: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface NewAttachmentInput {
  ticketId: string;
  messageId?: string | null;
  uploaderId: string;
  uploaderName: string;
  fileName: string;
  storedName: string;
  mimeType: string;
  size: number;
}

export interface CreateTicketInput {
  userId: string;
  username: string;
  avatar: string;
  type: string;
  subject: string;
  description: string;
  userRole?: string;
}

export function hasOpenTicketOfType(userId: string, type: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT 1 FROM tickets WHERE userId = ? AND type = ? AND status IN ('open', 'in-progress') AND archivedAt IS NULL LIMIT 1")
    .get(userId, type);
  return !!row;
}

export function createTicket(input: CreateTicketInput): Ticket {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO tickets (id, userId, username, avatar, type, subject, description, status, priority, userRole, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'open', 'medium', ?, ?, ?)
  `);

  stmt.run(id, input.userId, input.username, input.avatar, input.type, input.subject, input.description, input.userRole || null, now, now);

  return getTicketById(id)!;
}

export function getTicketById(id: string): Ticket | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket | undefined;
  return row || null;
}

export function getTicketsByUser(userId: string): Ticket[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM tickets WHERE userId = ? AND archivedAt IS NULL ORDER BY createdAt DESC")
    .all(userId) as Ticket[];
}

export function getAllTickets(): Ticket[] {
  const db = getDb();
  return db.prepare("SELECT * FROM tickets WHERE archivedAt IS NULL ORDER BY createdAt DESC").all() as Ticket[];
}

export function getArchivedTickets(): Ticket[] {
  const db = getDb();
  return db.prepare("SELECT * FROM tickets WHERE archivedAt IS NOT NULL ORDER BY archivedAt DESC").all() as Ticket[];
}

/** Soft-deletes a ticket by setting its archivedAt timestamp. Messages and files are preserved. */
export function archiveTicket(id: string): Ticket | null {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE tickets SET archivedAt = ?, updatedAt = ? WHERE id = ?").run(now, now, id);
  return getTicketById(id);
}

/** Restores an archived ticket back to the active list. */
export function restoreTicket(id: string): Ticket | null {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE tickets SET archivedAt = NULL, updatedAt = ? WHERE id = ?").run(now, id);
  return getTicketById(id);
}

export function updateTicketStatus(id: string, status: Ticket["status"]): Ticket | null {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE tickets SET status = ?, updatedAt = ? WHERE id = ?").run(status, now, id);
  return getTicketById(id);
}

export function updateTicketType(id: string, type: string): Ticket | null {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE tickets SET type = ?, updatedAt = ? WHERE id = ?").run(type, now, id);
  return getTicketById(id);
}

export function updateTicketPriority(id: string, priority: Ticket["priority"]): Ticket | null {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE tickets SET priority = ?, updatedAt = ? WHERE id = ?").run(priority, now, id);
  return getTicketById(id);
}

export function assignTicket(id: string, staffUserId: string | null, staffUsername: string | null): Ticket | null {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE tickets SET assignedTo = ?, assignedToUsername = ?, updatedAt = ? WHERE id = ?").run(
    staffUserId,
    staffUsername,
    now,
    id
  );
  return getTicketById(id);
}

export function addTicketMessage(
  ticketId: string,
  userId: string,
  username: string,
  avatar: string,
  content: string,
  isInternal: boolean = false
): TicketMessage {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO ticket_messages (id, ticketId, userId, username, avatar, content, isInternal, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ticketId, userId, username, avatar, content, isInternal ? 1 : 0, now);

  return db.prepare("SELECT * FROM ticket_messages WHERE id = ?").get(id) as TicketMessage;
}

export function logTicketActivity(ticketId: string, content: string): TicketMessage {
  return addTicketMessage(ticketId, "system", "System", "", content, false);
}

export function getTicketMessages(ticketId: string): TicketMessage[] {
  const db = getDb();
  return db.prepare("SELECT * FROM ticket_messages WHERE ticketId = ? ORDER BY createdAt ASC").all(
    ticketId
  ) as TicketMessage[];
}

export function getTicketMessagesForStaff(ticketId: string): TicketMessage[] {
  const db = getDb();
  return db.prepare("SELECT * FROM ticket_messages WHERE ticketId = ? ORDER BY createdAt ASC").all(
    ticketId
  ) as TicketMessage[];
}

export function getTicketMessagesForUser(ticketId: string): TicketMessage[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM ticket_messages WHERE ticketId = ? AND isInternal = 0 ORDER BY createdAt ASC")
    .all(ticketId) as TicketMessage[];
}

export function getTicketMessagesPaginated(
  ticketId: string,
  page: number,
  limit: number,
  staff: boolean
): { messages: TicketMessage[]; total: number } {
  const db = getDb();
  const offset = (page - 1) * limit;
  const where = staff
    ? "WHERE ticketId = ?"
    : "WHERE ticketId = ? AND isInternal = 0";

  const countRow = db
    .prepare(`SELECT COUNT(*) as count FROM ticket_messages ${where}`)
    .get(ticketId) as { count: number };

  const messages = db
    .prepare(
      `SELECT * FROM ticket_messages ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    )
    .all(ticketId, limit, offset) as TicketMessage[];

  return { messages, total: countRow.count };
}

export function addTicketAttachment(input: NewAttachmentInput): TicketAttachment {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO ticket_attachments (id, ticketId, messageId, uploaderId, uploaderName, fileName, storedName, mimeType, size, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.ticketId,
    input.messageId || null,
    input.uploaderId,
    input.uploaderName,
    input.fileName,
    input.storedName,
    input.mimeType,
    input.size,
    now
  );

  return db.prepare("SELECT * FROM ticket_attachments WHERE id = ?").get(id) as TicketAttachment;
}

export function getTicketAttachments(ticketId: string): TicketAttachment[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM ticket_attachments WHERE ticketId = ? ORDER BY createdAt ASC")
    .all(ticketId) as TicketAttachment[];
}

export function getAttachmentById(id: string): TicketAttachment | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM ticket_attachments WHERE id = ?").get(id) as TicketAttachment | undefined;
  return row || null;
}

export function getInternalMessageIds(ticketId: string): Set<string> {
  const db = getDb();
  const rows = db.prepare("SELECT id FROM ticket_messages WHERE ticketId = ? AND isInternal = 1").all(ticketId) as {
    id: string;
  }[];
  return new Set(rows.map((r) => r.id));
}

export interface DeletedTicket {
  ticket: Ticket;
  storedNames: string[];
}

/** Deletes a ticket and all of its messages + attachment rows. Returns the deleted ticket and stored file names. */
export function deleteTicket(ticketId: string): DeletedTicket | null {
  const db = getDb();
  const ticket = getTicketById(ticketId);
  if (!ticket) return null;

  const attachments = getTicketAttachments(ticketId);
  const storedNames = attachments.map((a) => a.storedName);

  const tx = db.transaction(() => {
    db.prepare("DELETE FROM ticket_attachments WHERE ticketId = ?").run(ticketId);
    db.prepare("DELETE FROM ticket_messages WHERE ticketId = ?").run(ticketId);
    db.prepare("DELETE FROM tickets WHERE id = ?").run(ticketId);
  });
  tx();

  return { ticket, storedNames };
}

export function canSendManualReminder(ticketId: string): { ok: boolean; retryAfterMs?: number } {
  const db = getDb();
  const row = db.prepare("SELECT reminderCooldownUntil FROM tickets WHERE id = ?").get(ticketId) as { reminderCooldownUntil: string | null } | undefined;
  if (!row) return { ok: false };
  if (!row.reminderCooldownUntil) return { ok: true };
  const cooldownEnd = new Date(row.reminderCooldownUntil).getTime();
  const now = Date.now();
  if (now >= cooldownEnd) return { ok: true };
  return { ok: false, retryAfterMs: cooldownEnd - now };
}

export function setReminderCooldown(ticketId: string, minutes: number): void {
  const db = getDb();
  const until = new Date(Date.now() + minutes * 60_000).toISOString();
  db.prepare("UPDATE tickets SET reminderCooldownUntil = ? WHERE id = ?").run(until, ticketId);
}

export function setStaffReminderSent(ticketId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE tickets SET lastStaffReminderAt = ? WHERE id = ?").run(now, ticketId);
}

export interface StaleTicket {
  id: string;
  userId: string;
  username: string;
  type: string;
  subject: string;
  assignedToUsername: string | null;
  lastMessageAt: string;
  idleHours: number;
}

export function getStaleTickets(): StaleTicket[] {
  const db = getDb();
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

  const rows = db.prepare(`
    SELECT
      t.id, t.userId, t.username, t.type, t.subject, t.assignedToUsername,
      MAX(m.createdAt) as lastMessageAt,
      CAST((julianday('now') - julianday(MAX(m.createdAt))) * 24 AS INTEGER) as idleHours
    FROM tickets t
    LEFT JOIN ticket_messages m ON m.ticketId = t.id AND m.isInternal = 0
    WHERE t.status IN ('open', 'in-progress')
      AND t.archivedAt IS NULL
    GROUP BY t.id
    HAVING lastMessageAt IS NOT NULL
       AND lastMessageAt < ?
       AND (t.lastStaffReminderAt IS NULL OR t.lastStaffReminderAt < ?)
    ORDER BY lastMessageAt ASC
  `).all(cutoff24h, cutoff24h) as StaleTicket[];

  return rows;
}
