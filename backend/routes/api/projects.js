const express  = require('express');
const router   = express.Router();
const auth     = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Project  = require('../../models/Project');
const Profile  = require('../../models/Profile');
const Activity = require('../../models/Activity');

// Helper: emit an activity event via the io instance attached to app
function emitActivity(req, payload) {
  try { req.app.get('io').emit('activity', payload); } catch (_) {}
}

// ─── POST /api/projects ───────────────────────────────────────────────────────
router.post('/', [auth, [
  check('title',       'Title is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { title, description, techStack, rolesNeeded, skillsRequired, duration } = req.body;
    const project = new Project({
      user: req.user.id, title, description,
      techStack: techStack || [], rolesNeeded: rolesNeeded || [],
      skillsRequired: skillsRequired || [], duration
    });
    await project.save();
    await project.populate('user', ['name', 'avatar']);

    // Record + broadcast activity
    const act = await Activity.create({
      type: 'project_posted',
      actor: req.user.id,
      meta: { projectId: project._id.toString(), projectTitle: title }
    });
    emitActivity(req, {
      _id: act._id, type: 'project_posted',
      actor: { _id: req.user.id, name: project.user.name, avatar: project.user.avatar },
      meta: act.meta, createdAt: act.createdAt
    });

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ─── GET /api/projects ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('user',       ['name', 'avatar'])
      .populate('applicants', ['name', 'avatar'])
      .populate('members',    ['name', 'avatar'])
      .sort({ date: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// ─── GET /api/projects/suggest/me ────────────────────────────────────────────
router.get('/suggest/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(400).json({ msg: 'No profile found' });
    const skillNames = profile.skills.map(s => s.name);
    const projects = await Project.find({
      skillsRequired: { $in: skillNames.map(s => new RegExp(s, 'i')) },
      status: 'open',
      user: { $ne: req.user.id }
    }).populate('user', ['name', 'avatar']).limit(6);
    res.json(projects);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// ─── GET /api/projects/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('user', ['name', 'avatar'])
      .populate('applicants', ['name', 'avatar'])
      .populate('members',    ['name', 'avatar']);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// ─── PUT /api/projects/apply/:id ─────────────────────────────────────────────
router.put('/apply/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('user', ['name', 'avatar']);
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    if (project.user._id.toString() === req.user.id)
      return res.status(400).json({ msg: 'You cannot apply to your own project' });

    if (project.applicants.some(a => a.toString() === req.user.id))
      return res.status(400).json({ msg: 'Already applied' });

    project.applicants.unshift(req.user.id);
    await project.save();

    // Notify the project owner via DM socket room
    req.app.get('io').to(`dm_${project.user._id}`).emit('notification', {
      type: 'project_applied',
      message: `Someone applied to your project "${project.title}"`,
      projectId: project._id
    });

    // Broadcast to activity feed
    const act = await Activity.create({
      type: 'project_applied',
      actor: req.user.id,
      meta: { projectId: project._id.toString(), projectTitle: project.title }
    });
    // Populate actor name for the broadcast
    const User = require('../../models/User');
    const actorUser = await User.findById(req.user.id).select('name avatar');
    emitActivity(req, {
      _id: act._id, type: 'project_applied',
      actor: { _id: req.user.id, name: actorUser.name, avatar: actorUser.avatar },
      meta: act.meta, createdAt: act.createdAt
    });

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ─── PUT /api/projects/status/:id ────────────────────────────────────────────
router.put('/status/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    if (project.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });
    project.status = req.body.status;
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// ─── PUT /api/projects/:id ────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    if (project.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });
    const { title, description, techStack, rolesNeeded, duration, status } = req.body;
    if (title)       project.title       = title;
    if (description) project.description = description;
    if (techStack)   project.techStack   = techStack;
    if (rolesNeeded) project.rolesNeeded = rolesNeeded;
    if (duration !== undefined) project.duration = duration;
    if (status)      project.status      = status;
    await project.save();
    await project.populate('user', ['name', 'avatar']);
    res.json(project);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    if (project.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });
    await project.deleteOne();
    res.json({ msg: 'Project removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;

// ─── PUT /api/projects/applicant/:id ──────────────────────────────────────────
// Owner accepts or rejects an applicant
// body: { applicantId, action: 'accept' | 'reject' }
router.put('/applicant/:id', auth, async (req, res) => {
  try {
    const { applicantId, action } = req.body;
    if (!['accept','reject'].includes(action))
      return res.status(400).json({ msg: 'Invalid action' });

    const project = await Project.findById(req.params.id).populate('user','name avatar');
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    if (project.user._id.toString() !== req.user.id)
      return res.status(401).json({ msg: 'Not authorized' });

    if (action === 'accept') {
      if (!project.members.map(m=>m.toString()).includes(applicantId)) {
        project.members.push(applicantId);
      }
    }
    // Remove from applicants either way
    project.applicants = project.applicants.filter(a => a.toString() !== applicantId);
    await project.save();

    // Notify the applicant — socket (real-time) + stored (persistent)
    const notifMsg = action === 'accept'
      ? `🎉 You were accepted into "${project.title}"!`
      : `Your application to "${project.title}" was not accepted this time.`;

    // Real-time push
    req.app.get('io').to(`dm_${applicantId}`).emit('notification', {
      type: `application_${action}ed`,
      message: notifMsg,
      projectId: project._id.toString()
    });

    // Persist so applicant sees it even if they weren't online
    const Notification = require('../../models/Notification');
    await Notification.create({
      recipient: applicantId,
      type: `application_${action}ed`,
      message: notifMsg,
      meta: { projectId: project._id.toString(), projectTitle: project.title }
    });

    await project.populate('applicants', ['name','avatar']);
    await project.populate('members', ['name','avatar']);
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
