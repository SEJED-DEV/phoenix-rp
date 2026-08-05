import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "tickets.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      username TEXT NOT NULL,
      avatar TEXT NOT NULL,
      type TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      assignedTo TEXT DEFAULT NULL,
      assignedToUsername TEXT DEFAULT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  const ticketCols = _db.prepare("PRAGMA table_info(tickets)").all() as { name: string }[];
  const colNames = ticketCols.map((c) => c.name);
  if (!colNames.includes("priority")) {
    _db.exec("ALTER TABLE tickets ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'");
  }
  if (!colNames.includes("assignedTo")) {
    _db.exec("ALTER TABLE tickets ADD COLUMN assignedTo TEXT DEFAULT NULL");
  }
  if (!colNames.includes("assignedToUsername")) {
    _db.exec("ALTER TABLE tickets ADD COLUMN assignedToUsername TEXT DEFAULT NULL");
  }
  if (!colNames.includes("userRole")) {
    _db.exec("ALTER TABLE tickets ADD COLUMN userRole TEXT DEFAULT NULL");
  }

  _db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticketId TEXT NOT NULL,
      userId TEXT NOT NULL,
      username TEXT NOT NULL,
      avatar TEXT NOT NULL,
      content TEXT NOT NULL,
      isInternal INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
    )
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_attachments (
      id TEXT PRIMARY KEY,
      ticketId TEXT NOT NULL,
      messageId TEXT DEFAULT NULL,
      uploaderId TEXT NOT NULL,
      uploaderName TEXT NOT NULL,
      fileName TEXT NOT NULL,
      storedName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      size INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
    )
  `);

  // ─── Staff Panel Tables ───

  _db.exec(`
    CREATE TABLE IF NOT EXISTS staff_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actorId TEXT NOT NULL,
      actorName TEXT NOT NULL,
      action TEXT NOT NULL,
      targetId TEXT,
      targetName TEXT,
      reason TEXT,
      metadata TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discordId TEXT NOT NULL,
      username TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      reviewerId TEXT,
      reviewerName TEXT,
      reviewNote TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      reviewedAt TEXT
    )
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      authorId TEXT NOT NULL,
      authorName TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      pinned INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS staff_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      authorId TEXT NOT NULL,
      authorName TEXT NOT NULL,
      targetId TEXT NOT NULL,
      targetName TEXT NOT NULL,
      body TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS server_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ─── Dynamic Application Questions ───

  _db.exec(`
    CREATE TABLE IF NOT EXISTS application_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dept TEXT NOT NULL,
      questionKey TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      required INTEGER NOT NULL DEFAULT 0,
      placeholder TEXT,
      options TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      updatedBy TEXT,
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (dept, questionKey)
    )
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS application_question_editors (
      dept TEXT NOT NULL,
      granteeType TEXT NOT NULL,
      granteeId TEXT NOT NULL,
      granteeName TEXT NOT NULL DEFAULT '',
      grantedBy TEXT,
      grantedByUser TEXT,
      grantedAt TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (dept, granteeType, granteeId)
    )
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS application_viewers (
      dept TEXT NOT NULL,
      granteeType TEXT NOT NULL,
      granteeId TEXT NOT NULL,
      granteeName TEXT NOT NULL DEFAULT '',
      grantedBy TEXT,
      grantedByUser TEXT,
      grantedAt TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (dept, granteeType, granteeId)
    )
  `);

  // ─── FAQ Questions ───

  _db.exec(`
    CREATE TABLE IF NOT EXISTS faq_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      updatedBy TEXT,
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ─── Application Tables (one per department) ───

  const APPLICATION_SLUGS = [
    "whitelist",
    "police",
    "ems",
    "mechanic",
    "family",
    "doj",
    "staff_staffteam",
    "ban_appeal",
  ];

  for (const slug of APPLICATION_SLUGS) {
    _db.exec(`
      CREATE TABLE IF NOT EXISTS applications_${slug} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discordId TEXT NOT NULL,
        username TEXT NOT NULL,
        formData TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewerId TEXT,
        reviewerName TEXT,
        reviewNote TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        reviewedAt TEXT
      )
    `);
  }

  return _db;
}
