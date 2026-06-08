const Activity = require('../../models/Activity');
const express = require('express');
const router  = express.Router();
const auth    = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Room = require('../../models/Room');

// POST /api/rooms
router.post('/', [auth, [check('title','Title is required').not().isEmpty()]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { title, description, goal, deadline, techStack } = req.body;
    const room = new Room({ creator: req.user.id, title, description, goal, deadline,
      techStack: techStack || [], members: [req.user.id] });
    await room.save();
    await room.populate('creator', ['name','avatar']);
    await room.populate('members',  ['name','avatar']);
    // Broadcast to activity feed
    try {
      const act = await Activity.create({
        type: 'room_created', actor: req.user.id,
        meta: { roomId: room._id.toString(), roomTitle: room.title }
      });
      req.app.get('io').emit('activity', {
        _id: act._id, type: 'room_created',
        actor: { _id: req.user.id, name: room.creator.name, avatar: room.creator.avatar },
        meta: act.meta, createdAt: act.createdAt
      });
    } catch (_) {}
    res.json(room);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// GET /api/rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate('creator', ['name','avatar'])
      .populate('members',      ['name','avatar'])
      .populate('joinRequests', ['name','avatar'])
      .sort({ date: -1 });
    res.json(rooms);
  } catch (err) { res.status(500).send('Server error'); }
});

// GET /api/rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator', ['name','avatar'])
      .populate('members',      ['name','avatar'])
      .populate('joinRequests', ['name','avatar']);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    res.json(room);
  } catch (err) { res.status(500).send('Server error'); }
});

// POST /api/rooms/request/:id — send join request
router.post('/request/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    if (room.members.some(m => (m._id || m).toString() === req.user.id))
      return res.status(400).json({ msg: 'Already a member' });
    if (room.joinRequests.some(r => (r._id || r).toString() === req.user.id))
      return res.status(400).json({ msg: 'Request already sent' });
    room.joinRequests.push(req.user.id);
    await room.save();
    // Notify creator via socket
    req.app.get('io').to(`dm_${room.creator}`).emit('room_join_request', {
      roomId: room._id, roomTitle: room.title, userId: req.user.id
    });
    res.json({ msg: 'Request sent' });
  } catch (err) { res.status(500).send('Server error'); }
});

// PUT /api/rooms/approve/:id — creator approves/rejects a join request
// body: { userId, action: 'approve'|'reject' }
router.put('/approve/:id', auth, async (req, res) => {
  try {
    const { userId, action } = req.body;
    const room = await Room.findById(req.params.id)
      .populate('members', ['name','avatar'])
      .populate('joinRequests', ['name','avatar']);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    if (room.creator.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });
    // Remove from requests
    room.joinRequests = room.joinRequests.filter(r => r._id?.toString() !== userId && r.toString() !== userId);
    if (action === 'approve') room.members.push(userId);
    await room.save();
    // Notify applicant
    const msg = action === 'approve'
      ? `✅ Your request to join "${room.title}" was approved!`
      : `Your request to join "${room.title}" was not approved.`;
    req.app.get('io').to(`dm_${userId}`).emit('notification', { type: `room_${action}d`, message: msg, roomId: room._id.toString() });
    // Persist so user sees it even if offline
    const Notification = require('../../models/Notification');
    await Notification.create({
      recipient: userId,
      type: `room_${action}d`,
      message: msg,
      meta: { roomId: room._id.toString(), roomTitle: room.title }
    }).catch(() => {});
    // Broadcast join to activity feed
    if (action === 'approve') {
      try {
        const User = require('../../models/User');
        const joiner = await User.findById(userId).select('name avatar');
        const act = await Activity.create({
          type: 'room_joined', actor: userId,
          meta: { roomId: room._id.toString(), roomTitle: room.title }
        });
        req.app.get('io').emit('activity', {
          _id: act._id, type: 'room_joined',
          actor: { _id: userId, name: joiner?.name, avatar: joiner?.avatar },
          meta: act.meta, createdAt: act.createdAt
        });
      } catch (_) {}
    }
    await room.populate('joinRequests', ['name','avatar']);
    await room.populate('members', ['name','avatar']);
    res.json(room);
  } catch (err) { console.error(err); res.status(500).send('Server error'); }
});

// PUT /api/rooms/leave/:id — member leaves a room
router.put('/leave/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    if (room.creator.toString() === req.user.id)
      return res.status(400).json({ msg: 'Creator cannot leave. Delete the room instead.' });
    room.members = room.members.filter(m => m.toString() !== req.user.id);
    await room.save();
    res.json({ msg: 'Left room' });
  } catch (err) { res.status(500).send('Server error'); }
});

// PUT /api/rooms/tasks/:id
router.put('/tasks/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    room.tasks = req.body.tasks;
    await room.save();
    res.json(room.tasks);
  } catch (err) { res.status(500).send('Server error'); }
});

// PUT /api/rooms/code/:id  — persist scratchpad snapshot
router.put('/code/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    if (req.body.content !== undefined) room.codeContent = req.body.content;
    if (req.body.lang)    room.codeLang    = req.body.lang;
    await room.save();
    res.json({ ok: true });
  } catch (err) { res.status(500).send('Server error'); }
});

// PUT /api/rooms/notes/:id
router.put('/notes/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    room.notes = req.body.notes ?? room.notes;
    await room.save();
    res.json({ ok: true });
  } catch (err) { res.status(500).send('Server error'); }
});

// POST /api/rooms/link/:id — add pinned link
router.post('/link/:id', auth, async (req, res) => {
  try {
    const { label, url } = req.body;
    if (!url) return res.status(400).json({ msg: 'URL required' });
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    const link = { id: Date.now().toString(), label: label || url, url, addedBy: req.user.id };
    room.pinnedLinks.push(link);
    await room.save();
    res.json(room.pinnedLinks);
  } catch (err) { res.status(500).send('Server error'); }
});

// DELETE /api/rooms/link/:id/:linkId
router.delete('/link/:id/:linkId', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    room.pinnedLinks = room.pinnedLinks.filter(l => l.id !== req.params.linkId);
    await room.save();
    res.json(room.pinnedLinks);
  } catch (err) { res.status(500).send('Server error'); }
});

// DELETE /api/rooms/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    if (room.creator.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });
    room.isActive = false;
    await room.save();
    res.json({ msg: 'Room closed' });
  } catch (err) { res.status(500).send('Server error'); }
});


// PUT /api/rooms/toggle/:id — creator toggles isActive
router.put('/toggle/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    if (room.creator.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });
    room.isActive = !room.isActive;
    await room.save();
    res.json({ isActive: room.isActive });
  } catch (err) { res.status(500).send('Server error'); }
});

// PUT /api/rooms/:id — edit room details
router.put('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    if (room.creator.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });
    const { title, description, goal, deadline, techStack } = req.body;
    if (title)       room.title       = title;
    if (description !== undefined) room.description = description;
    if (goal !== undefined)        room.goal        = goal;
    if (deadline !== undefined)    room.deadline    = deadline || null;
    if (techStack)   room.techStack   = techStack;
    await room.save();
    res.json(room);
  } catch (err) { res.status(500).send('Server error'); }
});

module.exports = router;
