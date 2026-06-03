const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const auth    = require('../../middleware/auth');
const Message = require('../../models/Message');
const User    = require('../../models/User');

function makeConvId(idA, idB) {
  return [idA.toString(), idB.toString()].sort().join('_');
}

// ─── GET /api/messages/unread/count ──────────────────────────────────────────
// MUST be declared before /:userId so Express doesn't treat "unread" as a userId
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user.id, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── GET /api/messages/inbox ──────────────────────────────────────────────────
router.get('/inbox', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const oid = new mongoose.Types.ObjectId(userId); // FIX: use `new`

    const convos = await Message.aggregate([
      { $match: { $or: [{ sender: oid }, { receiver: oid }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unread: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$read', false] }, { $eq: ['$receiver', oid] }] },
                1, 0
              ]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    const populated = await Promise.all(convos.map(async (c) => {
      const msg   = c.lastMessage;
      const peerId = msg.sender.toString() === userId ? msg.receiver : msg.sender;
      const peer  = await User.findById(peerId).select('name avatar');
      return {
        conversationId: c._id,
        peer,
        lastMessage: msg.text,
        lastAt: msg.createdAt,
        unread: c.unread
      };
    }));

    res.json(populated);
  } catch (err) {
    console.error('inbox error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── GET /api/messages/:userId ────────────────────────────────────────────────
router.get('/:userId', auth, async (req, res) => {
  try {
    const myId   = req.user.id;
    const peerId = req.params.userId;
    const convId = makeConvId(myId, peerId);
    const before = req.query.before ? new Date(req.query.before) : new Date();

    const messages = await Message
      .find({ conversationId: convId, createdAt: { $lt: before } })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    await Message.updateMany(
      { conversationId: convId, receiver: myId, read: false },
      { $set: { read: true } }
    );

    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── POST /api/messages/:userId ───────────────────────────────────────────────
router.post('/:userId', auth, async (req, res) => {
  try {
    const myId   = req.user.id;
    const peerId = req.params.userId;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ msg: 'Message cannot be empty' });

    const msg = await new Message({
      conversationId: makeConvId(myId, peerId),
      sender:   myId,
      receiver: peerId,
      text:     text.trim()
    }).save();

    res.json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
module.exports.makeConvId = makeConvId;
