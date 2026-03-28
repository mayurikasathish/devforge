const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Doubt = require('../../models/Doubt');

// @route  POST api/doubts
// @desc   Post a doubt (optionally anonymous)
// @access Private
router.post('/', [auth, [
  check('title', 'Title is required').not().isEmpty(),
  check('body', 'Body is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { title, body, tags, anonymous } = req.body;
    const doubt = new Doubt({
      user: req.user.id, title, body,
      tags: tags || [], anonymous: anonymous !== false
    });
    await doubt.save();
    res.json(doubt);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/doubts
// @desc   Get all doubts (with optional tag filter)
// @access Public
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.tag) filter.tags = req.query.tag;
    const doubts = await Doubt.find(filter)
      .populate('user', ['name', 'avatar'])
      .sort({ date: -1 });
    const masked = doubts.map(d => {
      const obj = d.toObject();
      // Always expose _ownerId so frontend can identify own posts regardless of anonymity
      obj._ownerId = obj.user?._id?.toString();
      if (obj.anonymous) { obj.user = { name: 'Anonymous', avatar: null }; }
      return obj;
    });
    res.json(masked);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/doubts/:id
// @desc   Get doubt by ID
// @access Public
router.get('/:id', async (req, res) => {
  try {
    const doubt = await Doubt.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    ).populate('user', ['name', 'avatar'])
     .populate('answers.user', ['name', 'avatar']);
    if (!doubt) return res.status(404).json({ msg: 'Doubt not found' });
    const obj = doubt.toObject();
    if (obj.anonymous) obj.user = { name: 'Anonymous', avatar: null };
    obj.answers = obj.answers.map(a => {
      if (a.anonymous) a.user = { name: 'Anonymous', avatar: null };
      return a;
    });
    res.json(obj);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  POST api/doubts/answer/:id
// @desc   Answer a doubt
// @access Private
router.post('/answer/:id', [auth, [
  check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ msg: 'Doubt not found' });
    const answer = { user: req.user.id, text: req.body.text, anonymous: req.body.anonymous || false };
    doubt.answers.unshift(answer);
    await doubt.save();
    res.json(doubt.answers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/doubts/upvote/:id
// @desc   Upvote a doubt
// @access Private
router.put('/upvote/:id', auth, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (doubt.upvotes.includes(req.user.id)) {
      doubt.upvotes = doubt.upvotes.filter(u => u.toString() !== req.user.id);
    } else {
      doubt.upvotes.push(req.user.id);
    }
    await doubt.save();
    res.json(doubt.upvotes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  DELETE api/doubts/:id
// @desc   Delete a doubt
// @access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ msg: 'Doubt not found' });
    if (doubt.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await doubt.deleteOne();
    res.json({ msg: 'Doubt removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
