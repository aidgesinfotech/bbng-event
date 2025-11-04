const db = require('../config/db');

const EventItems = {
  create: async ({ event_id, name, isActive = 1 }) => {
    // derive code from name (upper snake) and next sequence for this event
    const base = (name || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'ITEM';
    // Ensure code uniqueness per event by appending a number if needed
    let code = base;
    let tries = 0;
    while (tries < 5) {
      const [exists] = await db.execute(`SELECT id FROM event_items WHERE event_id = ? AND code = ? LIMIT 1`, [event_id, code]);
      if (!exists.length) break;
      tries += 1;
      code = `${base}_${tries+1}`;
    }
    const [[seqRow]] = await db.query(`SELECT COALESCE(MAX(sequence),0)+1 AS nextSeq FROM event_items WHERE event_id = ?`, [event_id]);
    const nextSeq = seqRow?.nextSeq || 1;
    const sql = `INSERT INTO event_items (event_id, name, code, sequence, isActive) VALUES (?, ?, ?, ?, ?)`;
    const [res] = await db.execute(sql, [event_id, name, code, nextSeq, isActive]);
    return { id: res.insertId };
  },

  listByEvent: async (event_id) => {
    const [rows] = await db.execute(
      `SELECT * FROM event_items WHERE event_id = ? ORDER BY sequence ASC, id ASC`, [event_id]
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.execute(`SELECT * FROM event_items WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  update: async (id, { name, code, sequence, isActive }) => {
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (code !== undefined) { fields.push('code = ?'); values.push(code); }
    if (sequence !== undefined) { fields.push('sequence = ?'); values.push(sequence); }
    if (isActive !== undefined) { fields.push('isActive = ?'); values.push(isActive); }
    if (!fields.length) return;
    const sql = `UPDATE event_items SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    values.push(id);
    await db.execute(sql, values);
  },

  deleteById: async (id) => {
    await db.execute(`DELETE FROM event_items WHERE id = ?`, [id]);
  }
};

module.exports = EventItems;
