const Chat = require('../models/Chat');
const Message = require('../models/Message');

class ChatHandlers {
  constructor(io) {
    this.io = io;
    this.onlineClients = new Map();
    this.onlineAdmins = new Set();
    this.adminToken = process.env.ADMIN_TOKEN;
  }

  async handleClientJoin(socket, data) {
    const { clientId, clientName, clientEmail } = data;
    
    // Store client socket
    this.onlineClients.set(socket.id, clientId);
    socket.join(`client_${clientId}`);
    
    // Find or create chat
    let chat = await Chat.findOne({ clientId });
    
    if (!chat) {
      chat = new Chat({
        clientId,
        clientName,
        clientEmail,
        lastMessageTime: new Date()
      });
      await chat.save();
    } else if (chat.status !== 'active') {
      chat.status = 'active';
      chat.updatedAt = new Date();
      await chat.save();
    }
    
    // Notify admins
    this.io.emit('admin_client_online', {
      clientId,
      clientName,
      socketId: socket.id
    });
    
    // Send chat history
    const previousMessages = await Message.find({ chatId: chat._id })
      .sort({ createdAt: 1 })
      .limit(50);
    
    socket.emit('chat_history', previousMessages);
    
    console.log(`📱 Client joined: ${clientName} (${clientId})`);
  }

  async handleClientMessage(socket, data) {
    const { clientId, message, clientName } = data;
    
    const chat = await Chat.findOne({ clientId });
    if (!chat) return;
    
    // Save message
    const newMessage = new Message({
      chatId: chat._id,
      sender: 'client',
      senderName: clientName,
      message: message,
      read: false
    });
    await newMessage.save();
    
    // Update chat metadata
    chat.lastMessage = message;
    chat.lastMessageTime = new Date();
    chat.unreadCount += 1;
    await chat.save();
    
    // Notify admins
    this.io.emit('admin_new_message', {
      chatId: chat._id,
      clientId,
      clientName,
      message,
      timestamp: newMessage.createdAt,
      messageId: newMessage._id
    });
    
    // Confirm to client
    socket.emit('message_sent', newMessage);
  }

  async handleAdminAuth(socket, token) {
    if (token === this.adminToken) {
      this.onlineAdmins.add(socket.id);
      socket.join('admin_room');
      
      const activeChats = await Chat.find({ status: 'active' })
        .sort({ updatedAt: -1 })
        .lean();
      
      socket.emit('admin_chats_list', activeChats);
      console.log(`👨‍💼 Admin connected: ${socket.id}`);
    } else {
      socket.emit('auth_error', 'Invalid admin token');
    }
  }

  async handleAdminMessage(socket, data) {
    const { clientId, message, adminName } = data;
    
    const chat = await Chat.findOne({ clientId });
    if (!chat) return;
    
    // Save admin message
    const newMessage = new Message({
      chatId: chat._id,
      sender: 'admin',
      senderName: adminName || 'Admin',
      message: message,
      read: true
    });
    await newMessage.save();
    
    // Update chat metadata
    chat.lastMessage = message;
    chat.lastMessageTime = new Date();
    await chat.save();
    
    // Send to client
    this.io.to(`client_${clientId}`).emit('admin_message', {
      message,
      timestamp: newMessage.createdAt,
      senderName: adminName || 'Admin'
    });
    
    // Confirm to admin
    socket.emit('admin_message_sent', newMessage);
  }

  handleClientTyping(socket, data) {
    const { clientId, isTyping } = data;
    this.io.to('admin_room').emit('admin_client_typing', { clientId, isTyping });
  }

  handleAdminTyping(socket, data) {
    const { clientId, isTyping } = data;
    this.io.to(`client_${clientId}`).emit('client_admin_typing', { isTyping });
  }

  handleDisconnect(socket) {
    console.log(`🔌 Disconnected: ${socket.id}`);
    this.onlineAdmins.delete(socket.id);
    
    const clientId = this.onlineClients.get(socket.id);
    if (clientId) {
      this.onlineClients.delete(socket.id);
      this.io.emit('admin_client_offline', { clientId });
    }
  }
}

module.exports = ChatHandlers;