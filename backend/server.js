const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

// Connect Database
connectDB();

// Init Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Define Routes
app.use('/api/users',   require('./routes/api/users'));
app.use('/api/auth',    require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts',   require('./routes/api/posts'));
app.use('/api/projects',require('./routes/api/projects'));
app.use('/api/doubts',  require('./routes/api/doubts'));
app.use('/api/rooms',   require('./routes/api/rooms'));
app.use('/api/github',  require('./routes/api/github'));

app.get('/', (req, res) => res.json({ message: '🚀 DevForge API Running' }));

// Socket.IO for Build Together Rooms
const roomChats = {};

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  socket.on('join_room', ({ roomId, userName }) => {
    socket.join(roomId);
    if (!roomChats[roomId]) roomChats[roomId] = [];
    socket.to(roomId).emit('user_joined', { userName });
    socket.emit('chat_history', roomChats[roomId]);
  });

  socket.on('send_message', ({ roomId, message, userName, avatar }) => {
    const msgObj = { message, userName, avatar, time: new Date().toISOString() };
    if (!roomChats[roomId]) roomChats[roomId] = [];
    roomChats[roomId].push(msgObj);
    io.to(roomId).emit('receive_message', msgObj);
  });

  socket.on('task_update', ({ roomId, tasks }) => {
    socket.to(roomId).emit('tasks_updated', tasks);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 DevForge Server running on port ${PORT}`));
