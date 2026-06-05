const express  = require('express');
const router   = express.Router();
const auth     = require('../../middleware/auth');
const Activity = require('../../models/Activity');
const Profile  = require('../../models/Profile');

// GET /api/activity — last 30 events (public, for live feed panel)
router.get('/', async (req, res) => {
  try {
    const feed = await Activity.find()
      .populate('actor', ['name', 'avatar'])
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    res.json(feed);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/activity/following — events from people you follow only (for bell)
router.get('/following', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).select('following');
    const followingIds = profile?.following || [];

    // Only people you follow — exclude yourself to avoid self-notifications
    const actorIds = followingIds.map(id => id.toString());
    if (!actorIds.length) return res.json([]); // following nobody yet

    const feed = await Activity.find({ actor: { $in: actorIds } })
      .populate('actor', ['name', 'avatar'])
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(feed);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
