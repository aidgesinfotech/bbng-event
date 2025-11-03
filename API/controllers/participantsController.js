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
    const { name, email, phone, company } = req.body || {};
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'name, email, phone are required' });
    }
    const qr_code = uuidV4();
    const { id } = await Participants.create({ name, email, phone, company, qr_code });
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

    const { name = existing.name, email = existing.email, company = existing.company } = req.body || {};
    await Participants.update(id, { name, email, company });
    const data = await Participants.getById(id);
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
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
