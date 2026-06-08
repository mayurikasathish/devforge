const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
const connectDB  = require('./config/db');

const app    = express();
const server = http.createServer(app);

// Allow multiple localhost ports for development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

const io     = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Make io accessible inside route handlers via req.app.get('io')
app.set('io', io);

connectDB();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
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
app.use('/api/code',     require('./routes/api/code'));

app.get('/', (req, res) => res.json({ message: '🚀 DevForge API Running' }));

const roomChats    = {};
const roomPresence = {};

io.on('connection', (socket) => {
  console.log('[Socket.IO] Client connected:', socket.id);

  socket.on('join_room', ({ roomId, userName, userId, avatar }) => {
    socket.join(roomId);
    socket.data.roomId   = roomId;
    socket.data.userName = userName;
    socket.data.userId   = userId;

    if (!roomChats[roomId])    roomChats[roomId] = { msgs: [] };
    if (!roomChats[roomId].msgs) roomChats[roomId].msgs = [];
    if (!roomPresence[roomId]) roomPresence[roomId] = {};

    roomPresence[roomId][socket.id] = { userId, userName, avatar };

    socket.to(roomId).emit('user_joined', { userName, userId, avatar });
    socket.emit('chat_history', roomChats[roomId].msgs);
    socket.emit('presence_update', Object.values(roomPresence[roomId]));
    socket.to(roomId).emit('presence_update', Object.values(roomPresence[roomId]));
  });

  socket.on('send_message', ({ roomId, message, userName, avatar }) => {
    const msgObj = { message, userName, avatar, time: new Date().toISOString() };
    if (!roomChats[roomId]) roomChats[roomId] = {};
    if (!roomChats[roomId].msgs) roomChats[roomId].msgs = [];
    roomChats[roomId].msgs.push(msgObj);
    if (roomChats[roomId].msgs.length > 200) roomChats[roomId].msgs.shift();
    socket.to(roomId).emit('receive_message', msgObj); // socket.to = others only, sender adds optimistically
  });

  socket.on('task_update', ({ roomId, tasks }) => {
    socket.to(roomId).emit('tasks_updated', tasks);
  });

  // ── Code scratchpad ───────────────────────────────────────────────────────
  socket.on('code_change', ({ roomId, content, lang }) => {
    socket.to(roomId).emit('code_update', { content, lang });
  });

  // ── Notes sync ────────────────────────────────────────────────────────────
  socket.on('notes_change', ({ roomId, notes }) => {
    socket.to(roomId).emit('notes_update', { notes });
  });

  // ── Links sync ────────────────────────────────────────────────────────────
  socket.on('links_change', ({ roomId, links }) => {
    socket.to(roomId).emit('links_update', { links });
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

  socket.on('disconnect', () => {
    const { roomId, userName, userId } = socket.data || {};
    if (roomId && roomPresence[roomId]) {
      delete roomPresence[roomId][socket.id];
      io.to(roomId).emit('presence_update', Object.values(roomPresence[roomId]));
      io.to(roomId).emit('user_left', { userName, userId });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 DevForge running on port ${PORT}`));
