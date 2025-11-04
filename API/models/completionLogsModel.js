const db = require('../config/db');

const CompletionLogs = {
  create: async ({ event_id, item_id, participant_id, staff_id = null, device_info = null }) => {
    const sql = `INSERT INTO completion_logs (event_id, item_id, participant_id, staff_id, device_info) VALUES (?, ?, ?, ?, ?)`;
    await db.execute(sql, [event_id, item_id, participant_id, staff_id, device_info]);
  },
  listByParticipant: async ({ event_id, participant_id, limit = 50, page = 1 }) => {
    const offset = (page - 1) * limit;
    const [rows] = await db.execute(
      `SELECT l.*, i.name AS item_name, su.name AS staff_name
       FROM completion_logs l
       LEFT JOIN event_items i ON i.id = l.item_id
       LEFT JOIN staff_users su ON su.id = l.staff_id
       WHERE l.event_id = ? AND l.participant_id = ?
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [event_id, participant_id, Number(limit), Number(offset)]
    );
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM completion_logs WHERE event_id = ? AND participant_id = ?`,
      [event_id, participant_id]
    );
    return { data: rows, total: countRows[0].total };
  }
};

module.exports = CompletionLogs;
