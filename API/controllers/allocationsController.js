const Allocations = require('../models/allocationsModel');

exports.bulkModify = async (req, res) => {
  try {
    const event_id = Number(req.params.eventId);
    const { item_ids = [], participant_ids = [], mode = 'add' } = req.body || {};
    if (!event_id || !item_ids.length || !participant_ids.length) {
      return res.status(400).json({ error: 'eventId, item_ids, participant_ids are required' });
    }
    const result = await Allocations.bulkModify({ event_id, item_ids, participant_ids, mode });
    res.status(200).json({ status: 'success', ...result });
  } catch (err) {
    console.error('bulkModify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.list = async (req, res) => {
  try {
    const event_id = Number(req.params.eventId);
    const item_id = req.query.item_id ? Number(req.query.item_id) : undefined;
    const status = req.query.status || undefined;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const search = String(req.query.search || '');
    const data = await Allocations.list({ event_id, item_id, status, search, page, limit });
    res.status(200).json({ status: 'success', ...data });
  } catch (err) {
    console.error('allocations list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listForParticipant = async (req, res) => {
  try {
    const event_id = Number(req.params.eventId);
    const participant_id = Number(req.params.participantId);
    const data = await Allocations.listForParticipant({ event_id, participant_id });
    res.status(200).json({ status: 'success', data });
  } catch (err) {
    console.error('allocations listForParticipant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
