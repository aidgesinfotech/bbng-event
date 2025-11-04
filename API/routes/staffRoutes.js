const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { auth } = require('../middlewares/auth');
const { staffAuth } = require('../middlewares/staffAuth');

// Public login for staff/guards
router.post('/login', staffController.loginStaff);

// Staff self routes
router.get('/history', staffAuth, staffController.scanHistory);
router.get('/summary', staffAuth, staffController.scanSummary);

// Admin-protected CRUD for staff users
router.post('/', auth, staffController.createStaff);
router.get('/', auth, staffController.listStaff);
router.put('/:id', auth, staffController.updateStaff);
router.put('/:id/status', auth, staffController.updateStaffStatus);
router.delete('/:id', auth, staffController.deleteStaff);
router.get('/:id/report', auth, staffController.staffReport);

module.exports = router;
