const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Project = require('../../models/Project');
const Profile = require('../../models/Profile');

// @route  POST api/projects
// @desc   Create a project listing
// @access Private
router.post('/', [auth, [
  check('title', 'Title is required').not().isEmpty(),
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
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/projects
// @desc   Get all open projects
// @access Public
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ status: 'open' })
      .populate('user', ['name', 'avatar'])
      .sort({ date: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/projects/:id
// @desc   Get project by ID
// @access Public
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('user', ['name', 'avatar'])
      .populate('applicants', ['name', 'avatar'])
      .populate('members', ['name', 'avatar']);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/projects/apply/:id
// @desc   Apply to a project
// @access Private
router.put('/apply/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    if (project.applicants.some(a => a.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Already applied' });
    }
    project.applicants.unshift(req.user.id);
    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/projects/suggest/:skills
// @desc   Suggest projects matching user skills
// @access Private
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
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  DELETE api/projects/:id
// @desc   Delete a project
// @access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    if (project.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await project.deleteOne();
    res.json({ msg: 'Project removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
