const db = require('../config/db');

const Events = {
  create: async ({ name, code, start_at = null, end_at = null, isActive = 1 }) => {
    const sql = `INSERT INTO events (name, code, start_at, end_at, isActive) VALUES (?, ?, ?, ?, ?)`;
    const [res] = await db.execute(sql, [name, code, start_at, end_at, isActive]);
    return { id: res.insertId };
  },

  list: async ({ page = 1, limit = 10, search = '' }) => {
    const offset = (page - 1) * limit;
    let where = '';
    let params = [];
    if (search) {
      where = `WHERE name LIKE ? OR code LIKE ?`;
      params = [`%${search}%`, `%${search}%`];
    }
    const [rows] = await db.execute(
      `SELECT * FROM events ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    const [countRows] = await db.execute(`SELECT COUNT(*) AS total FROM events ${where}`, params);
    return { data: rows, total: countRows[0].total };
  },

  getById: async (id) => {
    const [rows] = await db.execute(`SELECT * FROM events WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  update: async (id, { name, code, start_at, end_at, isActive }) => {
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (code !== undefined) { fields.push('code = ?'); values.push(code); }
    if (start_at !== undefined) { fields.push('start_at = ?'); values.push(start_at); }
    if (end_at !== undefined) { fields.push('end_at = ?'); values.push(end_at); }
    if (isActive !== undefined) { fields.push('isActive = ?'); values.push(isActive); }
    if (!fields.length) return;
    const sql = `UPDATE events SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    values.push(id);
    await db.execute(sql, values);
  },

  softDelete: async (id) => {
    await db.execute(`UPDATE events SET isActive = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
  }
};

module.exports = Events;
