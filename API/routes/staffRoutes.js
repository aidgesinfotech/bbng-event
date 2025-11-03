const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { auth } = require('../middlewares/auth');

// Public login for staff/guards
router.post('/login', staffController.loginStaff);

// Admin-protected CRUD for staff users
router.post('/', auth, staffController.createStaff);
router.get('/', auth, staffController.listStaff);
router.put('/:id', auth, staffController.updateStaff);
router.put('/:id/status', auth, staffController.updateStaffStatus);
router.delete('/:id', auth, staffController.deleteStaff);

module.exports = router;
