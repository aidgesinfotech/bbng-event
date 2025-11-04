const CompletionLogs = require('../models/completionLogsModel');

exports.listForParticipant = async (req, res) => {
  try {
    const event_id = Number(req.params.eventId);
    const participant_id = Number(req.params.participantId);
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const data = await CompletionLogs.listByParticipant({ event_id, participant_id, page, limit });
    res.status(200).json({ status: 'success', ...data });
  } catch (err) {
    console.error('completion logs list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
