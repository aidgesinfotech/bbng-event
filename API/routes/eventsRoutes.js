const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { auth } = require('../middlewares/auth');

// Events
router.post('/', auth, eventsController.createEvent);
router.get('/', eventsController.listEvents);
router.get('/:id', auth, eventsController.getEvent);
router.put('/:id', auth, eventsController.updateEvent);
router.delete('/:id', auth, eventsController.deleteEvent);

// Items within an event
router.post('/:eventId/items', auth, eventsController.createItem);
router.get('/:eventId/items', auth, eventsController.listItems);
router.put('/:eventId/items/:itemId', auth, eventsController.updateItem);
router.delete('/:eventId/items/:itemId', auth, eventsController.deleteItem);

module.exports = router;
