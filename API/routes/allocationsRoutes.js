const express = require('express');
const router = express.Router();
const allocationsController = require('../controllers/allocationsController');
const { auth } = require('../middlewares/auth');

// Bulk modify allocations for an event
router.post('/events/:eventId/allocations/bulk', auth, allocationsController.bulkModify);

// List allocations for an event (with filters)
router.get('/events/:eventId/allocations', auth, allocationsController.list);

// List allocations for a participant within an event
router.get('/events/:eventId/participants/:participantId/allocations', auth, allocationsController.listForParticipant);

module.exports = router;
