const express      = require('express');
const router       = express.Router();
const auth         = require('../../middleware/auth');
const Notification = require('../../models/Notification');

// GET /api/notifications — fetch my unread notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifs = await Notification.find({ recipient: req.user.id, read: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, { $set: { read: true } });
    res.json({ msg: 'Marked all read' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
