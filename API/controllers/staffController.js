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
