const db = require('../config/db');

const Participants = {
  create: async ({ name, email, phone, area, company, gst, business_category, qr_code }) => {
    const sql = `INSERT INTO participants (name, email, phone, area, company, gst, business_category, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const [res] = await db.execute(sql, [name, email, phone, area || null, company || null, gst || null, business_category || null, qr_code]);
    return { id: res.insertId };
  },
  ensureActivitiesRow: async (participant_id) => {
    const [rows] = await db.execute(`SELECT id FROM activities WHERE participant_id = ?`, [participant_id]);
    if (rows.length === 0) {
      await db.execute(`INSERT INTO activities (participant_id, welcome_kit, breakfast, lunch, high_tea, timestamps) VALUES (?, 0, 0, 0, 0, JSON_OBJECT())`, [participant_id]);
    }
  },
  list: async ({ limit = 10, page = 1, search = '' }) => {
    const offset = (page - 1) * limit;
    let where = '';
    let params = [];
    if (search) {
      where = `WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ? OR area LIKE ? OR business_category LIKE ?`;
      params = Array(6).fill(`%${search}%`);
    }
    const [rows] = await db.execute(
      `SELECT * FROM participants ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM participants ${where}`,
      params
    );
    return { data: rows, total: countRows[0].total };
  },
  getById: async (id) => {
    const [rows] = await db.execute(`SELECT * FROM participants WHERE id = ?`, [id]);
    return rows[0] || null;
  },
  getByQRCode: async (qr_code) => {
    const [rows] = await db.execute(`SELECT * FROM participants WHERE qr_code = ?`, [qr_code]);
    return rows[0] || null;
  },
  getByPhone: async (phone) => {
    const [rows] = await db.execute(`SELECT * FROM participants WHERE phone = ?`, [phone]);
    return rows[0] || null;
  },
  update: async (id, { name, email, phone, area, company, gst, business_category }) => {
    const sql = `UPDATE participants SET name = ?, email = ?, phone = ?, area = ?, company = ?, gst = ?, business_category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await db.execute(sql, [name, email, phone, area || null, company || null, gst || null, business_category || null, id]);
  },
  deleteById: async (id) => {
    await db.execute(`DELETE FROM participants WHERE id = ?`, [id]);
  }
};

module.exports = Participants;
