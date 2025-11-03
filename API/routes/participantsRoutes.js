const express = require('express');
const router = express.Router();
const participantsController = require('../controllers/participantsController');
const { auth } = require('../middlewares/auth');

// Admin protected routes
router.post('/', auth, participantsController.createParticipant);
router.get('/', auth, participantsController.listParticipants);
router.get('/export/csv', auth, participantsController.exportCSV);
router.get('/:id', auth, participantsController.getParticipant);
router.put('/:id', auth, participantsController.updateParticipant);
router.delete('/:id', auth, participantsController.deleteParticipant);

module.exports = router;
