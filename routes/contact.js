const express = require('express');
const contactController = require('../controllers/contactController');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/submit', contactController.submitContact);

// Admin routes (protected)
router.get('/messages', verifyAdmin, contactController.getAllMessages);
router.get('/messages/:id', verifyAdmin, contactController.getMessageById);
router.put('/messages/:id/reply', verifyAdmin, contactController.markAsReplied);
router.delete('/messages/:id', verifyAdmin, contactController.deleteMessage);
router.get('/statistics', verifyAdmin, contactController.getStatistics);

module.exports = router;