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
  _db.pragma("busy_timeout = 5000");

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
  if (!colNames.includes("archivedAt")) {
    _db.exec("ALTER TABLE tickets ADD COLUMN archivedAt TEXT DEFAULT NULL");
  }
  if (!colNames.includes("reminderCooldownUntil")) {
    _db.exec("ALTER TABLE tickets ADD COLUMN reminderCooldownUntil TEXT DEFAULT NULL");
  }
  if (!colNames.includes("lastStaffReminderAt")) {
    _db.exec("ALTER TABLE tickets ADD COLUMN lastStaffReminderAt TEXT DEFAULT NULL");
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

  _db.exec(`
    CREATE TABLE IF NOT EXISTS application_approvers (
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

  // ─── Site Config Grants (delegated branding/content editors) ───

  _db.exec(`
    CREATE TABLE IF NOT EXISTS site_config_grants (
      scope TEXT NOT NULL,
      granteeType TEXT NOT NULL,
      granteeId TEXT NOT NULL,
      granteeName TEXT NOT NULL DEFAULT '',
      grantedBy TEXT,
      grantedByUser TEXT,
      grantedAt TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (scope, granteeType, granteeId)
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

  // ─── Shop ───

  _db.exec(`
    CREATE TABLE IF NOT EXISTS shop_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'manual',
      forumThreadId TEXT,
      forumUrl TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      position INTEGER NOT NULL DEFAULT 0,
      updatedBy TEXT,
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const shopCols = _db.prepare("PRAGMA table_info(shop_items)").all() as { name: string }[];
  const shopColNames = shopCols.map((c) => c.name);
  if (!shopColNames.includes("prices")) {
    _db.exec("ALTER TABLE shop_items ADD COLUMN prices TEXT NOT NULL DEFAULT '[]'");
  }

  // ─── Mass DM Broadcast (owner-only) ───

  _db.exec(`
    CREATE TABLE IF NOT EXISTS broadcast_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      createdBy TEXT NOT NULL,
      createdByName TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      startedAt TEXT,
      completedAt TEXT,
      totalMembers INTEGER NOT NULL DEFAULT 0,
      delayMs INTEGER NOT NULL DEFAULT 1500,
      lastError TEXT
    )
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS broadcast_recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId INTEGER NOT NULL,
      userId TEXT NOT NULL,
      username TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      updatedAt TEXT,
      UNIQUE (jobId, userId)
    )
  `);

  // ─── Console relay (site / bot / tunnel stdout -> Discord) ───

  _db.exec(`
    CREATE TABLE IF NOT EXISTS console_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'log',
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ─── Gallery metadata ───

  _db.exec(`
    CREATE TABLE IF NOT EXISTS gallery_items (
      filename TEXT PRIMARY KEY,
      description TEXT NOT NULL DEFAULT '',
      credits TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0
    )
  `);

  const galleryCols = _db.prepare("PRAGMA table_info(gallery_items)").all() as { name: string }[];
  const galleryColNames = galleryCols.map((c) => c.name);
  if (!galleryColNames.includes("credits")) {
    _db.exec("ALTER TABLE gallery_items ADD COLUMN credits TEXT NOT NULL DEFAULT ''");
  }
  if (!galleryColNames.includes("src")) {
    _db.exec("ALTER TABLE gallery_items ADD COLUMN src TEXT NOT NULL DEFAULT ''");
    _db.exec("UPDATE gallery_items SET src = '/media/' || filename WHERE src = '' AND filename NOT LIKE 'http%'");
  }

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

  // ─── Streamers ───

  _db.exec(`
    CREATE TABLE IF NOT EXISTS streamers (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL DEFAULT 'twitch',
      username TEXT NOT NULL,
      displayName TEXT NOT NULL DEFAULT '',
      avatarUrl TEXT NOT NULL DEFAULT '',
      channelUrl TEXT NOT NULL DEFAULT '',
      socialLinks TEXT NOT NULL DEFAULT '[]',
      position INTEGER NOT NULL DEFAULT 0
    )
  `);

  const streamerCols = _db.prepare("PRAGMA table_info(streamers)").all() as { name: string }[];
  const streamerColNames = streamerCols.map((c) => c.name);
  if (!streamerColNames.includes("socialLinks")) {
    _db.exec("ALTER TABLE streamers ADD COLUMN socialLinks TEXT NOT NULL DEFAULT '[]'");
  }

  _db.exec(`
    CREATE TABLE IF NOT EXISTS departed_members (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      username TEXT NOT NULL,
      displayName TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL DEFAULT '',
      punishmentRoles TEXT NOT NULL DEFAULT '[]',
      allRoles TEXT NOT NULL DEFAULT '[]',
      leftAt TEXT NOT NULL,
      rejoined INTEGER NOT NULL DEFAULT 0
    )
  `);

  return _db;
}
