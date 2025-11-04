const jwt = require('jsonwebtoken');
const Staff = require('../models/staffModel');

exports.createStaff = async (req, res) => {
  try {
    const { username, password, name, isActive = 1 } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    // NOTE: For MVP storing plain password. Recommend hashing with bcrypt later.
    const { id } = await Staff.create({ username, password, name, isActive });
    const data = await Staff.getById(id);
    res.status(201).json({ status: 'success', data });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'username already exists' });
    console.error('createStaff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin: staff report by staff id (requires admin auth)
exports.staffReport = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id required' });
    const db = require('../config/db');
    const limit = Math.min(Number(req.query.limit || 100), 500);

    const [[totals]] = await db.execute(
      `SELECT COUNT(*) AS scans,
              COUNT(DISTINCT event_id) AS events,
              COUNT(DISTINCT participant_id) AS participants
       FROM scan_audit WHERE staff_id = ?`, [id]
    );

    const [rows] = await db.execute(
      `SELECT a.id, a.at,
              e.id AS event_id, e.name AS event_name,
              i.id AS item_id, i.name AS item_name,
              p.id AS participant_id, p.name AS participant_name, p.phone AS participant_phone
       FROM scan_audit a
       JOIN events e ON e.id = a.event_id
       JOIN event_items i ON i.id = a.item_id
       JOIN participants p ON p.id = a.participant_id
       WHERE a.staff_id = ?
       ORDER BY a.at DESC
       LIMIT ?`, [id, limit]
    );

    res.status(200).json({ status: 'success', data: { totals: totals || { scans:0, events:0, participants:0 }, list: rows || [] } });
  } catch (err) {
    console.error('staffReport error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Staff: summary tiles (totals)
exports.scanSummary = async (req, res) => {
  try {
    const staff = req.staff; if(!staff?.id) return res.status(401).json({ error: 'Unauthorized' });
    const db = require('../config/db');
    const event_id = req.query.event_id ? Number(req.query.event_id) : null;
    const where = ['staff_id = ?']; const params = [staff.id];
    if(event_id){ where.push('event_id = ?'); params.push(event_id); }
    const whereSql = where.join(' AND ');

    const [[totalRow]] = await db.execute(`SELECT COUNT(*) AS total FROM scan_audit WHERE ${whereSql}`, params);
    const [[todayRow]] = await db.execute(`SELECT COUNT(*) AS total FROM scan_audit WHERE ${whereSql} AND DATE(at) = CURDATE()`, params);
    const [[eventsRow]] = await db.execute(`SELECT COUNT(DISTINCT event_id) AS total FROM scan_audit WHERE ${whereSql}`, params);
    const [[participantsRow]] = await db.execute(`SELECT COUNT(DISTINCT participant_id) AS total FROM scan_audit WHERE ${whereSql}`, params);

    res.status(200).json({ status: 'success', data: {
      pending: 0,
      completed: Number(totalRow?.total || 0),
      events: Number(eventsRow?.total || 0),
      total: Number(participantsRow?.total || 0),
      today: Number(todayRow?.total || 0)
    }});
  } catch (err) {
    console.error('scanSummary error:', err); res.status(500).json({ error: 'Internal server error' });
  }
};

// Staff: scan history for authenticated staff user
exports.scanHistory = async (req, res) => {
  try {
    const staff = req.staff; // set by staffAuth middleware
    if (!staff?.id) return res.status(401).json({ error: 'Unauthorized' });

    const db = require('../config/db');
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Number(req.query.limit || 20), 200);
    const offset = (page - 1) * limit;
    const event_id = req.query.event_id ? Number(req.query.event_id) : null;

    const where = ['a.staff_id = ?'];
    const params = [staff.id];
    if (event_id) { where.push('a.event_id = ?'); params.push(event_id); }

    const [rows] = await db.execute(
      `SELECT a.id, a.at, a.event_id, a.item_id, a.participant_id,
              e.name AS event_name,
              i.name AS item_name,
              p.name AS participant_name, p.phone AS participant_phone
       FROM scan_audit a
       JOIN events e ON e.id = a.event_id
       JOIN event_items i ON i.id = a.item_id
       JOIN participants p ON p.id = a.participant_id
       WHERE ${where.join(' AND ')}
       ORDER BY a.at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.status(200).json({ status: 'success', data: rows, page, limit });
  } catch (err) {
    console.error('scanHistory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listStaff = async (req, res) => {
  try {
    const { limit = 10, page = 1, search = '' } = req.query || {};
    const result = await Staff.list({ limit: Number(limit), page: Number(page), search: String(search) });
    res.status(200).json({ status: 'success', ...result, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('listStaff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username, password, name, isActive } = req.body || {};
    await Staff.update(id, { username, password, name, isActive });
    const data = await Staff.getById(id);
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    console.error('updateStaff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStaffStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body || {};
    await Staff.updateStatus(id, Number(isActive ? 1 : 0));
    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('updateStaffStatus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await Staff.getById(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await Staff.deleteById(id);
    return res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('deleteStaff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.loginStaff = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const row = await Staff.getByUsername(username);
    if (!row) return res.status(404).json({ error: 'User not found' });
    if (!row.isActive) return res.status(403).json({ error: 'Inactive user' });
    if (row.password !== password) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: row.id, type: 'Scanner Staff' }, process.env.JWT_KEY);
    await Staff.updateToken(row.id, token);

    res.status(200).json({ status: 'success', user: { id: row.id, username: row.username, name: row.name }, token });
  } catch (err) {
    console.error('loginStaff error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
