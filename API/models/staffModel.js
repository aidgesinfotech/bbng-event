const db = require('../config/db');

const Staff = {
  create: async ({ username, password, name = null, isActive = 1 }) => {
    const sql = `INSERT INTO staff_users (username, password, name, isActive) VALUES (?, ?, ?, ?)`;
    const [res] = await db.execute(sql, [username, password, name, isActive]);
    return { id: res.insertId };
  },
  list: async ({ limit = 10, page = 1, search = '' }) => {
    const offset = (page - 1) * limit;
    let where = '';
    let params = [];
    if (search) {
      where = `WHERE username LIKE ? OR name LIKE ?`;
      params = [`%${search}%`, `%${search}%`];
    }
    const [rows] = await db.execute(
      `SELECT id, username, name, isActive, created_at, updated_at FROM staff_users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM staff_users ${where}`,
      params
    );
    return { data: rows, total: countRows[0].total };
  },
  getById: async (id) => {
    const [rows] = await db.execute(`SELECT id, username, name, isActive, created_at, updated_at FROM staff_users WHERE id = ?`, [id]);
    return rows[0] || null;
  },
  getByUsername: async (username) => {
    const [rows] = await db.execute(`SELECT * FROM staff_users WHERE username = ?`, [username]);
    return rows[0] || null;
  },
  update: async (id, { username, password, name, isActive }) => {
    const [res] = await db.execute(
      `UPDATE staff_users SET username = ?, password = ?, name = ?, isActive = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [username, password, name, isActive, id]
    );
    return res;
  },
  updateStatus: async (id, isActive) => {
    const [res] = await db.execute(`UPDATE staff_users SET isActive = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [isActive, id]);
    return res;
  },
  updateToken: async (id, token) => {
    await db.execute(`UPDATE staff_users SET token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [token, id]);
  },
  deleteById: async (id) => {
    await db.execute(`DELETE FROM staff_users WHERE id = ?`, [id]);
  }
};

module.exports = Staff;
