const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
const connectDB  = require('./config/db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

// Make io accessible inside route handlers via req.app.get('io')
app.set('io', io);

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/users',    require('./routes/api/users'));
app.use('/api/auth',     require('./routes/api/auth'));
app.use('/api/profile',  require('./routes/api/profile'));
app.use('/api/posts',    require('./routes/api/posts'));
app.use('/api/projects', require('./routes/api/projects'));
app.use('/api/doubts',   require('./routes/api/doubts'));
app.use('/api/rooms',    require('./routes/api/rooms'));
app.use('/api/github',   require('./routes/api/github'));
app.use('/api/messages', require('./routes/api/messages'));
app.use('/api/activity',       require('./routes/api/activity'));
app.use('/api/notifications',   require('./routes/api/notifications'));

app.get('/', (req, res) => res.json({ message: '🚀 DevForge API Running' }));

const roomChats = {};

io.on('connection', (socket) => {
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

  socket.on('dm_join', ({ userId }) => {
    if (userId) socket.join(`dm_${userId}`);
  });

  socket.on('dm_send', async ({ senderId, senderName, senderAvatar, receiverId, text }) => {
    if (!text?.trim()) return;
    try {
      const Message = require('./models/Message');
      const { makeConvId } = require('./routes/api/messages');
      const msg = await new Message({
        conversationId: makeConvId(senderId, receiverId),
        sender: senderId, receiver: receiverId, text: text.trim()
      }).save();
      const payload = {
        _id: msg._id, conversationId: msg.conversationId,
        sender: senderId, receiver: receiverId,
        senderName, senderAvatar, text: msg.text, createdAt: msg.createdAt
      };
      io.to(`dm_${receiverId}`).emit('dm_receive', payload);
      io.to(`dm_${senderId}`).emit('dm_receive', payload);
    } catch (err) { console.error('DM error:', err); }
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 DevForge running on port ${PORT}`));
