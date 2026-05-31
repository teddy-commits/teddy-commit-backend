const express = require('express');
const { verifyAdmin } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

const router = express.Router();

// Apply admin verification to all routes
router.use(verifyAdmin);

// Chat management routes
router.get('/chats', chatController.getActiveChats);
router.get('/chats/:chatId/messages', chatController.getChatMessages);
router.post('/chats/:chatId/read', chatController.markMessagesAsRead);
router.post('/chats/:chatId/archive', chatController.archiveChat);

module.exports = router;