const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { auth } = require('../middlewares/auth.js');

router.get('/superAdminDashboard',auth, DashboardController.superadminDashboard);
router.get('/activityCounts', auth, DashboardController.activityCounts);
router.get('/notTakenParticipants', auth, DashboardController.notTakenParticipants);

module.exports = router;