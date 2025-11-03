const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const completionLogsController = require('../controllers/completionLogsController');

// List completion logs for a participant within an event
router.get('/completion-logs/events/:eventId/participants/:participantId', auth, completionLogsController.listForParticipant);

module.exports = router;
