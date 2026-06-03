const Contact = require('../models/Contact');

const contactController = {
  // Submit contact form
  submitContact: async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
          success: false, 
          error: 'All fields are required' 
        });
      }
      
      // Create new contact entry
      const contact = new Contact({
        name,
        email,
        subject,
        message,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      });
      
      await contact.save();
      
      // Optional: Send email notification to admin
      // You can integrate nodemailer here
      
      res.status(201).json({ 
        success: true, 
        message: 'Message sent successfully! I will get back to you soon.' 
      });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send message. Please try again later.' 
      });
    }
  },
  
  // Get all contact messages (Admin only)
  getAllMessages: async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const query = {};
      
      if (status) query.status = status;
      
      const messages = await Contact.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
      
      const total = await Contact.countDocuments(query);
      
      res.json({
        success: true,
        messages,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch messages' 
      });
    }
  },
  
  // Get single message by ID (Admin only)
  getMessageById: async (req, res) => {
    try {
      const { id } = req.params;
      const message = await Contact.findById(id);
      
      if (!message) {
        return res.status(404).json({ 
          success: false, 
          error: 'Message not found' 
        });
      }
      
      // Mark as read if not already
      if (message.status === 'unread') {
        message.status = 'read';
        message.readAt = new Date();
        await message.save();
      }
      
      res.json({ success: true, message });
    } catch (error) {
      console.error('Error fetching message:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch message' 
      });
    }
  },
  
  // Mark message as replied (Admin only)
  markAsReplied: async (req, res) => {
    try {
      const { id } = req.params;
      const { replyMessage } = req.body;
      
      const message = await Contact.findByIdAndUpdate(
        id,
        { 
          status: 'replied', 
          repliedAt: new Date(),
          replyMessage: replyMessage || ''
        },
        { new: true }
      );
      
      if (!message) {
        return res.status(404).json({ 
          success: false, 
          error: 'Message not found' 
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Message marked as replied' 
      });
    } catch (error) {
      console.error('Error updating message:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update message' 
      });
    }
  },
  
  // Delete message (Admin only)
  deleteMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const message = await Contact.findByIdAndDelete(id);
      
      if (!message) {
        return res.status(404).json({ 
          success: false, 
          error: 'Message not found' 
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Message deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete message' 
      });
    }
  },
  
  // Get message statistics (Admin only)
  getStatistics: async (req, res) => {
    try {
      const total = await Contact.countDocuments();
      const unread = await Contact.countDocuments({ status: 'unread' });
      const read = await Contact.countDocuments({ status: 'read' });
      const replied = await Contact.countDocuments({ status: 'replied' });
      const today = await Contact.countDocuments({
        createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
      });
      
      res.json({
        success: true,
        statistics: { total, unread, read, replied, today }
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch statistics' 
      });
    }
  }
};

module.exports = contactController;