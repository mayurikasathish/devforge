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

// GET /api/activity/filtered — project events from following, doubts from everyone
router.get('/filtered', auth, async (req, res) => {
  try {
    console.log('[Activity] /filtered called by user:', req.user.id);
    const profile = await Profile.findOne({ user: req.user.id }).select('following');
    const followingIds = profile?.following?.map(id => id.toString()) || [];
    console.log('[Activity] User following:', followingIds.length, 'users ->', followingIds);

    // Fetch all activities
    const allActivities = await Activity.find()
      .populate('actor', ['name', 'avatar'])
      .sort({ createdAt: -1 })
      .limit(100) // fetch more to ensure we get 30 after filtering
      .lean();
    console.log('[Activity] Total activities fetched:', allActivities.length);

    // Filter based on type and following
    const filtered = allActivities.filter(activity => {
      const actorId = activity.actor?._id?.toString();

      // Exclude own activities
      if (actorId === req.user.id.toString()) {
        console.log('[Activity] Filtered out own activity:', activity.type);
        return false;
      }

      // For project events, only show from people you follow
      if (activity.type === 'project_posted' || activity.type === 'project_applied') {
        const included = followingIds.includes(actorId);
        console.log('[Activity]', activity.type, 'from', actorId, '- included?', included);
        return included;
      }

      // For doubt_posted, show from everyone
      if (activity.type === 'doubt_posted') {
        console.log('[Activity] doubt_posted from', actorId, '- showing (everyone sees doubts)');
        return true;
      }

      // Default: exclude unknown types
      return false;
    }).slice(0, 30); // cap at 30

    console.log('[Activity] Filtered down to:', filtered.length, 'items');
    res.json(filtered);
  } catch (err) {
    console.error('[Activity] Error:', err);
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
