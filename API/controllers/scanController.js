const Participants = require('../models/participantsModel');
const { Activities, VALID_ACTIVITIES } = require('../models/activitiesModel');

exports.markActivity = async (req, res) => {
  try {
    const { qr_code, activity } = req.body || {};
    if (!qr_code || !activity) {
      return res.status(400).json({ error: 'qr_code and activity are required' });
    }
    if (!VALID_ACTIVITIES.includes(activity)) {
      return res.status(400).json({ error: 'Invalid activity' });
    }

    const participant = await Participants.getByQRCode(qr_code);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    try {
      const updated = await Activities.markActivity({ participant_id: participant.id, activity });
      return res.status(200).json({ status: 'success', participant, activities: updated });
    } catch (e) {
      if (e && e.status === 409) {
        return res.status(409).json({ error: 'Already Taken', participant });
      }
      throw e;
    }
  } catch (err) {
    console.error('markActivity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
