const db = require('./db');

async function createParticipantsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS participants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      company VARCHAR(200) NULL,
      qr_code VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_participants_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await db.execute(sql);
  // Ensure unique index on phone even if table existed previously
  const [idx] = await db.execute(`SHOW INDEX FROM participants WHERE Key_name = 'uq_participants_phone'`);
  if (!idx || idx.length === 0) {
    await db.execute(`ALTER TABLE participants ADD UNIQUE KEY uq_participants_phone (phone)`);
  }
}

async function createCompletionLogsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS completion_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      item_id INT NOT NULL,
      participant_id INT NOT NULL,
      staff_id INT NULL,
      device_info TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_cl_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      CONSTRAINT fk_cl_item FOREIGN KEY (item_id) REFERENCES event_items(id) ON DELETE CASCADE,
      CONSTRAINT fk_cl_participant FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      INDEX idx_cl_event_participant (event_id, participant_id),
      INDEX idx_cl_event_item (event_id, item_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await db.execute(sql);
}

async function createActivitiesTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS activities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      participant_id INT NOT NULL,
      welcome_kit TINYINT(1) NOT NULL DEFAULT 0,
      breakfast TINYINT(1) NOT NULL DEFAULT 0,
      lunch TINYINT(1) NOT NULL DEFAULT 0,
      high_tea TINYINT(1) NOT NULL DEFAULT 0,
      timestamps JSON NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_activities_participant
        FOREIGN KEY (participant_id) REFERENCES participants(id)
        ON DELETE CASCADE,
      INDEX idx_activities_participant (participant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await db.execute(sql);
}

async function createStaffUsersTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS staff_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(200) NOT NULL,
      name VARCHAR(150) NULL,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      token TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await db.execute(sql);
}

async function createEventsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      code VARCHAR(100) NOT NULL,
      start_at DATETIME NULL,
      end_at DATETIME NULL,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_events_name (name),
      UNIQUE KEY uq_events_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await db.execute(sql);
}

async function createEventItemsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS event_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      name VARCHAR(200) NOT NULL,
      code VARCHAR(100) NOT NULL,
      sequence INT NOT NULL DEFAULT 0,
      isActive TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_event_items_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      UNIQUE KEY uq_event_items_name (event_id, name),
      UNIQUE KEY uq_event_items_code (event_id, code),
      INDEX idx_event_items_event (event_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await db.execute(sql);
}

async function createEventItemAllocationsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS event_item_allocations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      item_id INT NOT NULL,
      participant_id INT NOT NULL,
      status ENUM('pending','completed') NOT NULL DEFAULT 'pending',
      completed_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_alloc_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      CONSTRAINT fk_alloc_item FOREIGN KEY (item_id) REFERENCES event_items(id) ON DELETE CASCADE,
      CONSTRAINT fk_alloc_participant FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      UNIQUE KEY uq_alloc_unique (event_id, item_id, participant_id),
      INDEX idx_alloc_participant (participant_id),
      INDEX idx_alloc_event (event_id),
      INDEX idx_alloc_event_item (event_id, item_id),
      INDEX idx_alloc_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await db.execute(sql);
}

async function createScanAuditTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS scan_audit (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      item_id INT NOT NULL,
      participant_id INT NOT NULL,
      staff_id INT NULL,
      action ENUM('complete') NOT NULL,
      at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      device_info TEXT NULL,
      CONSTRAINT fk_audit_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      CONSTRAINT fk_audit_item FOREIGN KEY (item_id) REFERENCES event_items(id) ON DELETE CASCADE,
      CONSTRAINT fk_audit_participant FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await db.execute(sql);
}

async function initTables() {
  // Order: base tables first
  await createStaffUsersTable();
  await createParticipantsTable();
  await createActivitiesTable();

  // New dynamic events system
  await createEventsTable();
  await createEventItemsTable();
  await createEventItemAllocationsTable();
  await createScanAuditTable();
  await createCompletionLogsTable();
}

module.exports = {
  initTables
};
