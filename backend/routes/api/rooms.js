const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Room = require('../../models/Room');

// @route  POST api/rooms
// @desc   Create a build-together room
// @access Private
router.post('/', [auth, [
  check('title', 'Title is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { title, description, goal, deadline, techStack } = req.body;
    const room = new Room({
      creator: req.user.id,
      title, description, goal, deadline,
      techStack: techStack || [],
      members: [req.user.id]
    });
    await room.save();
    await room.populate('creator', ['name', 'avatar']);
    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/rooms
// @desc   Get all active rooms
// @access Public
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate('creator', ['name', 'avatar'])
      .populate('members', ['name', 'avatar'])
      .sort({ date: -1 });
    res.json(rooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/rooms/:id
// @desc   Get room by ID
// @access Public
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator', ['name', 'avatar'])
      .populate('members', ['name', 'avatar']);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/rooms/join/:id
// @desc   Join a room
// @access Private
router.put('/join/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    if (room.members.some(m => m.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Already a member' });
    }
    room.members.push(req.user.id);
    await room.save();
    res.json(room);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/rooms/tasks/:id
// @desc   Update tasks in room
// @access Private
router.put('/tasks/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    room.tasks = req.body.tasks;
    await room.save();
    res.json(room.tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  DELETE api/rooms/:id
// @desc   Delete/close a room
// @access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ msg: 'Room not found' });
    if (room.creator.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    room.isActive = false;
    await room.save();
    res.json({ msg: 'Room closed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
