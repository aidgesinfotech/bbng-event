const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { staffAuth } = require('../middlewares/staffAuth');

// Protected by staff login
router.post('/mark-activity', staffAuth, scanController.markActivity);

module.exports = router;
