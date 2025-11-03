const Allocations = require('../models/allocationsModel');
const Participants = require('../models/participantsModel');
const CompletionLogs = require('../models/completionLogsModel');

exports.getPendingByQR = async (req, res) => {
  try {
    const event_id = Number(req.query.event_id);
    const qr = String(req.query.qr || '');
    if (!event_id || !qr) return res.status(400).json({ error: 'event_id and qr are required' });

    // If the provided qr looks like a phone number (digits), search by phone
    const digits = qr.replace(/\D/g, '');
    let participant = null;
    if (digits && digits.length >= 7) {
      participant = await Participants.getByPhone(digits);
    }
    if (!participant) {
      participant = await Participants.getByQRCode(qr);
    }
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    const allocations = await Allocations.listForParticipant({ event_id, participant_id: participant.id });
    const pending = allocations.filter(a => a.status === 'pending');
    res.status(200).json({ status: 'success', participant, allocations, pending });
  } catch (err) {
    console.error('getPendingByQR error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.completeItem = async (req, res) => {
  try {
    const { qr_code, event_id, item_id, device_info } = req.body || {};
    if (!qr_code || !event_id || !item_id) return res.status(400).json({ error: 'qr_code, event_id, item_id are required' });

    // Accept mobile numbers as qr_code as well
    const digits = String(qr_code).replace(/\D/g, '');
    let participant = null;
    if (digits && digits.length >= 7) {
      participant = await Participants.getByPhone(digits);
    }
    if (!participant) {
      participant = await Participants.getByQRCode(qr_code);
    }
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    const staff_id = req.staff?.id || null;
    const changed = await Allocations.markComplete({ event_id, item_id, participant_id: participant.id, staff_id, device_info: device_info || null });
    if (changed === 0) return res.status(409).json({ error: 'Already completed or not allocated' });

    // Log completion
    try { await CompletionLogs.create({ event_id, item_id, participant_id: participant.id, staff_id, device_info: device_info || null }); } catch (e) { console.error('log completion failed:', e); }

    res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('completeItem error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
