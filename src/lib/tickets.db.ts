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
    .prepare("SELECT 1 FROM tickets WHERE userId = ? AND type = ? AND status IN ('open', 'in-progress') LIMIT 1")
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
  return db.prepare("SELECT * FROM tickets WHERE userId = ? ORDER BY createdAt DESC").all(userId) as Ticket[];
}

export function getAllTickets(): Ticket[] {
  const db = getDb();
  return db.prepare("SELECT * FROM tickets ORDER BY createdAt DESC").all() as Ticket[];
}

export function updateTicketStatus(id: string, status: Ticket["status"]): Ticket | null {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare("UPDATE tickets SET status = ?, updatedAt = ? WHERE id = ?").run(status, now, id);
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
