const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  chatId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Chat', 
    required: true 
  },
  sender: { 
    type: String, 
    enum: ['client', 'admin'],
    required: true 
  },
  senderName: {
    type: String,
    required: true
  },
  message: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  readAt: Date
}, {
  timestamps: true
});

// Indexes for performance
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ chatId: 1, read: 1 });

module.exports = mongoose.model('Message', MessageSchema);