const db = require('../config/db');

const Allocations = {
  // modes: add, remove, set
  bulkModify: async ({ event_id, item_ids = [], participant_ids = [], mode = 'add' }) => {
    if (!event_id || !item_ids.length || !participant_ids.length) return { added: 0, removed: 0 };

    let added = 0, removed = 0;

    if (mode === 'add' || mode === 'set') {
      const values = [];
      const placeholders = [];
      for (const item_id of item_ids) {
        for (const participant_id of participant_ids) {
          placeholders.push('(?, ?, ?, "pending", NULL)');
          values.push(event_id, item_id, participant_id);
        }
      }
      const sql = `INSERT IGNORE INTO event_item_allocations (event_id, item_id, participant_id, status, completed_at) VALUES ${placeholders.join(',')}`;
      const [res] = await db.execute(sql, values);
      added = res.affectedRows || 0;
    }

    if (mode === 'remove' || mode === 'set') {
      const inItems = item_ids.map(() => '?').join(',');
      const inParticipants = participant_ids.map(() => '?').join(',');
      const delSql = `DELETE FROM event_item_allocations WHERE event_id = ? AND item_id IN (${inItems}) AND participant_id IN (${inParticipants})`;
      const [delRes] = await db.execute(delSql, [event_id, ...item_ids, ...participant_ids]);
      removed = delRes.affectedRows || 0;

      if (mode === 'set') {
        const values = [];
        const placeholders = [];
        for (const item_id of item_ids) {
          for (const participant_id of participant_ids) {
            placeholders.push('(?, ?, ?, "pending", NULL)');
            values.push(event_id, item_id, participant_id);
          }
        }
        const sql = `INSERT IGNORE INTO event_item_allocations (event_id, item_id, participant_id, status, completed_at) VALUES ${placeholders.join(',')}`;
        const [res] = await db.execute(sql, values);
        added = res.affectedRows || 0;
      }
    }

    return { added, removed };
  },

  list: async ({ event_id, item_id, status, search = '', page = 1, limit = 10 }) => {
    const offset = (page - 1) * limit;
    const where = ['a.event_id = ?'];
    const params = [event_id];
    if (item_id) { where.push('a.item_id = ?'); params.push(item_id); }
    if (status) { where.push('a.status = ?'); params.push(status); }
    if (search) {
      where.push('(p.name LIKE ? OR p.email LIKE ? OR p.phone LIKE ? OR p.company LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await db.execute(
      `SELECT a.*, p.name, p.email, p.phone, p.company, i.name AS item_name, i.code AS item_code
       FROM event_item_allocations a
       JOIN participants p ON p.id = a.participant_id
       JOIN event_items i ON i.id = a.item_id
       ${whereSql}
       ORDER BY i.sequence ASC, a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM event_item_allocations a
       JOIN participants p ON p.id = a.participant_id
       JOIN event_items i ON i.id = a.item_id
       ${whereSql}`,
      params
    );

    return { data: rows, total: countRows[0].total };
  },

  listForParticipant: async ({ event_id, participant_id }) => {
    const [rows] = await db.execute(
      `SELECT a.*, i.name AS item_name, i.sequence
       FROM event_item_allocations a
       JOIN event_items i ON i.id = a.item_id
       WHERE a.event_id = ? AND a.participant_id = ?
       ORDER BY i.sequence ASC`,
      [event_id, participant_id]
    );
    return rows;
  },

  markComplete: async ({ event_id, item_id, participant_id, staff_id = null, device_info = null }) => {
    const [res] = await db.execute(
      `UPDATE event_item_allocations
       SET status = 'completed', completed_at = NOW(), updated_at = CURRENT_TIMESTAMP
       WHERE event_id = ? AND item_id = ? AND participant_id = ? AND status = 'pending'`,
      [event_id, item_id, participant_id]
    );
    const changed = res.affectedRows || 0;
    if (changed > 0) {
      await db.execute(
        `INSERT INTO scan_audit (event_id, item_id, participant_id, staff_id, action, device_info)
         VALUES (?, ?, ?, ?, 'complete', ?)`,
        [event_id, item_id, participant_id, staff_id, device_info]
      );
    }
    return changed;
  }
};

module.exports = Allocations;
