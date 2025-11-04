const Events = require('../models/eventsModel');
const EventItems = require('../models/eventItemsModel');

exports.createEvent = async (req, res) => {
  try {
    const { name, code, start_at, end_at, isActive = 1 } = req.body || {};
    if (!name || !code) return res.status(400).json({ error: 'name and code are required' });
    const { id } = await Events.create({ name, code, start_at, end_at, isActive });
    const data = await Events.getById(id);
    res.status(201).json({ status: 'success', data });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Event name/code already exists' });
    console.error('createEvent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listEvents = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = String(req.query.search || '');
    const data = await Events.list({ page, limit, search });
    res.status(200).json({ status: 'success', ...data });
  } catch (err) {
    console.error('listEvents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await Events.getById(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.status(200).json({ status: 'success', data: row });
  } catch (err) {
    console.error('getEvent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await Events.getById(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await Events.update(id, req.body || {});
    const data = await Events.getById(id);
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Event name/code already exists' });
    console.error('updateEvent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await Events.getById(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await Events.softDelete(id);
    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Items
exports.createItem = async (req, res) => {
  try {
    const event_id = Number(req.params.eventId);
    const { name, isActive = 1 } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { id } = await EventItems.create({ event_id, name, isActive });
    const data = await EventItems.getById(id);
    res.status(201).json({ status: 'success', data });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Item already exists for event' });
    console.error('createItem error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listItems = async (req, res) => {
  try {
    const event_id = Number(req.params.eventId);
    const rows = await EventItems.listByEvent(event_id);
    res.status(200).json({ status: 'success', data: rows });
  } catch (err) {
    console.error('listItems error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const id = Number(req.params.itemId);
    const existing = await EventItems.getById(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await EventItems.update(id, req.body || {});
    const data = await EventItems.getById(id);
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Item name/code already exists for event' });
    console.error('updateItem error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const id = Number(req.params.itemId);
    const existing = await EventItems.getById(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await EventItems.deleteById(id);
    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('deleteItem error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
