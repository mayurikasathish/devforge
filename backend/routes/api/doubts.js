const express = require('express');
const router  = express.Router();
const auth    = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Doubt    = require('../../models/Doubt');
const Activity = require('../../models/Activity');

function emitActivity(req, payload) {
  try { req.app.get('io').emit('activity', payload); } catch (_) {}
}

// ─── POST /api/doubts ─────────────────────────────────────────────────────────
router.post('/', [auth, [
  check('title', 'Title is required').not().isEmpty(),
  check('body',  'Body is required').not().isEmpty()
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

    // Always broadcast to feed, but mask identity if anonymous
    const User = require('../../models/User');
    const actor = await User.findById(req.user.id).select('name avatar');
    const act = await Activity.create({
      type: 'doubt_posted',
      actor: req.user.id,
      meta: { doubtId: doubt._id.toString(), doubtTitle: title }
    });
    emitActivity(req, {
      _id: act._id, type: 'doubt_posted',
      // If anonymous, show masked identity in feed — real actor still stored in DB for filtering
      actor: anonymous
        ? { _id: req.user.id, name: 'Anonymous', avatar: null }
        : { _id: req.user.id, name: actor.name, avatar: actor.avatar },
      meta: act.meta, createdAt: act.createdAt
    });

    res.json(doubt);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ─── GET /api/doubts ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.tag) filter.tags = req.query.tag;
    const doubts = await Doubt.find(filter)
      .populate('user', ['name', 'avatar'])
      .sort({ date: -1 });
    const masked = doubts.map(d => {
      const obj = d.toObject();
      obj._ownerId = obj.user?._id?.toString();
      if (obj.anonymous) obj.user = { name: 'Anonymous', avatar: null };
      return obj;
    });
    res.json(masked);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// ─── GET /api/doubts/:id ──────────────────────────────────────────────────────
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
    res.status(500).send('Server error');
  }
});

// ─── POST /api/doubts/answer/:id ─────────────────────────────────────────────
router.post('/answer/:id', [auth, [
  check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ msg: 'Doubt not found' });
    doubt.answers.unshift({ user: req.user.id, text: req.body.text, anonymous: req.body.anonymous || false });
    await doubt.save();
    res.json(doubt.answers);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// ─── PUT /api/doubts/upvote/:id ───────────────────────────────────────────────
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
    res.status(500).send('Server error');
  }
});

// ─── DELETE /api/doubts/:id ───────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ msg: 'Doubt not found' });
    if (doubt.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });
    await doubt.deleteOne();
    res.json({ msg: 'Doubt removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
