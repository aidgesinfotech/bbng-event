const { randomUUID } = require('crypto');
const Participants = require('../models/participantsModel');
const { Activities } = require('../models/activitiesModel');

function uuidV4() {
  try {
    return randomUUID();
  } catch (e) {
    // Fallback simple UUID v4 generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

exports.createParticipant = async (req, res) => {
  try {
    const { name, email, phone, area, company, gst, business_category } = req.body || {};
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'name, email, phone are required' });
    }
    const qr_code = uuidV4();
    const { id } = await Participants.create({ name, email, phone, area, company, gst, business_category, qr_code });
    await Participants.ensureActivitiesRow(id);
    const data = await Participants.getById(id);
    res.status(201).json({ status: 'success', data });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email or QR already exists' });
    }
    console.error('createParticipant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listParticipants = async (req, res) => {
  try {
    const { limit = 10, page = 1, search = '' } = req.query;
    const result = await Participants.list({ limit: Number(limit), page: Number(page), search: String(search) });
    res.status(200).json({ status: 'success', ...result, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('listParticipants error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getParticipant = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await Participants.getById(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.status(200).json({ status: 'success', data: row });
  } catch (err) {
    console.error('getParticipant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateParticipant = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await Participants.getById(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const {
      name = existing.name,
      email = existing.email,
      phone = existing.phone,
      area = existing.area,
      company = existing.company,
      gst = existing.gst,
      business_category = existing.business_category
    } = req.body || {};
    await Participants.update(id, { name, email, phone, area, company, gst, business_category });
    const data = await Participants.getById(id);
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email or Phone already exists' });
    }
    console.error('updateParticipant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteParticipant = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await Participants.getById(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await Participants.deleteById(id);
    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('deleteParticipant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Public: lookup participant by phone (no auth)
exports.publicLookupByPhone = async (req, res) => {
  try {
    const phone = String(req.query.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 7) return res.status(400).json({ error: 'phone is required' });
    const row = await Participants.getByPhone(phone);
    if (!row) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ status: 'success', data: row });
  } catch (err) {
    console.error('publicLookupByPhone error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Public: summary counts (pending, completed, events) for a participant by phone
exports.publicSummaryByPhone = async (req, res) => {
  try {
    const phone = String(req.query.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 7) return res.status(400).json({ error: 'phone is required' });
    const db = require('../config/db');
    const p = await Participants.getByPhone(phone);
    if (!p) return res.status(404).json({ error: 'Not found' });

    const participant_id = p.id;
    const event_id = req.query.event_id ? Number(req.query.event_id) : null;

    const whereSummary = ['participant_id = ?'];
    const paramsSummary = [participant_id];
    if (event_id) { whereSummary.push('event_id = ?'); paramsSummary.push(event_id); }

    const [rows] = await db.execute(
      `SELECT status, COUNT(*) AS cnt FROM event_item_allocations WHERE ${whereSummary.join(' AND ')} GROUP BY status`,
      paramsSummary
    );
    const [evRows] = await db.execute(
      `SELECT DISTINCT event_id FROM event_item_allocations WHERE participant_id = ? ORDER BY event_id DESC`,
      [participant_id]
    );
    const pending = Number(rows.find(r => r.status === 'pending')?.cnt || 0);
    const completed = Number(rows.find(r => r.status === 'completed')?.cnt || 0);
    const events = evRows.map(r => ({ event_id: r.event_id }));
    res.status(200).json({ status: 'success', data: { pending, completed, events } });
  } catch (err) {
    console.error('publicSummaryByPhone error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Public: history list for a participant by phone
exports.publicHistoryByPhone = async (req, res) => {
  try {
    const phone = String(req.query.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 7) return res.status(400).json({ error: 'phone is required' });
    const db = require('../config/db');
    const p = await Participants.getByPhone(phone);
    if (!p) return res.status(404).json({ error: 'Not found' });

    const participant_id = p.id;
    const status = req.query.status && ['pending','completed'].includes(String(req.query.status)) ? String(req.query.status) : null;
    const event_id = req.query.event_id ? Number(req.query.event_id) : null;
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const page = Math.max(Number(req.query.page || 1), 1);
    const offset = (page - 1) * limit;

    const where = ['a.participant_id = ?'];
    const params = [participant_id];
    if (status) { where.push('a.status = ?'); params.push(status); }
    if (event_id) { where.push('a.event_id = ?'); params.push(event_id); }

    const [rows] = await db.execute(
      `SELECT a.event_id, a.item_id, a.status, a.created_at, a.updated_at, a.completed_at,
              i.name AS item_name, i.code AS item_code
       FROM event_item_allocations a
       JOIN event_items i ON i.id = a.item_id
       WHERE ${where.join(' AND ')}
       ORDER BY a.updated_at DESC, a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.status(200).json({ status: 'success', data: rows });
  } catch (err) {
    console.error('publicHistoryByPhone error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const activity = req.query.activity;
    let rows = [];
    if (activity) {
      const result = await Activities.listNotTaken({ activity, limit: 1000000, page: 1 });
      rows = result.data;
    } else {
      // Join participants with activities for full export
      const db = require('../config/db');
      const [data] = await db.execute(`
        SELECT p.name, p.email, p.phone, p.company,
               IFNULL(a.welcome_kit,0) AS welcome_kit,
               IFNULL(a.breakfast,0) AS breakfast,
               IFNULL(a.lunch,0) AS lunch,
               IFNULL(a.high_tea,0) AS high_tea,
               a.updated_at AS last_updated
        FROM participants p
        LEFT JOIN activities a ON a.participant_id = p.id
        ORDER BY p.created_at DESC`);
      rows = data;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="participants.csv"');

    const headers = ['Name','Email','Phone','Company','Welcome Kit','Breakfast','Lunch','High Tea','Last Updated'];
    res.write(headers.join(',') + '\n');

    const toFlag = (v) => (v && Number(v) === 1 ? '✅' : '❌');

    for (const r of rows) {
      const line = [
        (r.name||'').replace(/,/g,' '),
        (r.email||''),
        (r.phone||''),
        (r.company||'').replace(/,/g,' '),
        toFlag(r.welcome_kit),
        toFlag(r.breakfast),
        toFlag(r.lunch),
        toFlag(r.high_tea),
        r.last_updated || ''
      ].join(',');
      res.write(line + '\n');
    }
    res.end();
  } catch (err) {
    console.error('exportCSV error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
