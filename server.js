require('dotenv').config();
const dns = require('dns');
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/database');
const configureSocket = require('./config/socket');
const adminRoutes = require('./routes/admin');
const ChatHandlers = require('./socket/chatHandlers');
const contactRoutes = require('./routes/contact');

// Fix DNS for Windows
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV 
  });
});

// Initialize Socket.IO
const io = configureSocket(server);
const chatHandlers = new ChatHandlers(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);
  
  // Client events
  socket.on('client_join', (data) => chatHandlers.handleClientJoin(socket, data));
  socket.on('client_message', (data) => chatHandlers.handleClientMessage(socket, data));
  socket.on('client_typing', (data) => chatHandlers.handleClientTyping(socket, data));
  
  // Admin events
  socket.on('admin_auth', (token) => chatHandlers.handleAdminAuth(socket, token));
  socket.on('admin_message', (data) => chatHandlers.handleAdminMessage(socket, data));
  socket.on('admin_typing', (data) => chatHandlers.handleAdminTyping(socket, data));
  
  // Disconnect
  socket.on('disconnect', () => chatHandlers.handleDisconnect(socket));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start listening
    server.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log(`🔑 Admin token configured: ${process.env.ADMIN_TOKEN ? 'Yes' : 'No'}`);
      console.log(`💬 WebSocket ready for connections\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

startServer();