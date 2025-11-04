const express = require('express');
const router = express.Router();
const scanEventsController = require('../controllers/scanEventsController');
const { staffAuth } = require('../middlewares/staffAuth');

// Staff-protected scanning for dynamic events
router.get('/pending', staffAuth, scanEventsController.getPendingByQR);
router.post('/complete', staffAuth, scanEventsController.completeItem);

module.exports = router;
