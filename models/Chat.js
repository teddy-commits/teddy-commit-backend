const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  clientId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  clientName: { 
    type: String, 
    required: true 
  },
  clientEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  clientAvatar: String,
  status: { 
    type: String, 
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  },
  lastMessage: String,
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  unreadCount: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true
});

// Index for faster queries
ChatSchema.index({ clientId: 1 });
ChatSchema.index({ status: 1, updatedAt: -1 });

module.exports = mongoose.model('Chat', ChatSchema);