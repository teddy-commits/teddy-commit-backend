const Chat = require('../models/Chat');
const Message = require('../models/Message');

const chatController = {
  // Get all active chats
  getActiveChats: async (req, res) => {
    try {
      const chats = await Chat.find({ status: 'active' })
        .sort({ updatedAt: -1 })
        .lean();
      
      res.json(chats);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch chats',
        details: error.message 
      });
    }
  },
  
  // Get messages for a specific chat
  getChatMessages: async (req, res) => {
    try {
      const { chatId } = req.params;
      
      const messages = await Message.find({ chatId })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean();
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch messages',
        details: error.message 
      });
    }
  },
  
  // Mark messages as read
  markMessagesAsRead: async (req, res) => {
    try {
      const { chatId } = req.params;
      
      await Message.updateMany(
        { chatId, sender: 'client', read: false },
        { read: true, readAt: new Date() }
      );
      
      await Chat.findByIdAndUpdate(chatId, { unreadCount: 0 });
      
      res.json({ 
        success: true, 
        message: 'Messages marked as read' 
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to mark messages as read',
        details: error.message 
      });
    }
  },
  
  // Archive chat
  archiveChat: async (req, res) => {
    try {
      const { chatId } = req.params;
      
      const chat = await Chat.findByIdAndUpdate(
        chatId, 
        { status: 'archived' },
        { new: true }
      );
      
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      
      res.json({ 
        success: true, 
        message: 'Chat archived successfully' 
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to archive chat',
        details: error.message 
      });
    }
  }
};

module.exports = chatController;