const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

// @route  GET api/profile/me
// @desc   Get current user's profile
// @access Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  POST api/profile
// @desc   Create or update user profile
// @access Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
      check('bio', 'Bio cannot exceed 300 characters').isLength({ max: 300 }),
      check('description', 'Description cannot exceed 500 characters').isLength({ max: 500 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company, website, location, bio, status, githubusername, leetcodeusername,
      skills, youtube, twitter, instagram, linkedin, facebook, availability
    } = req.body;

    const profileFields = { user: req.user.id };
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (leetcodeusername) profileFields.leetcodeusername = leetcodeusername;
    if (availability) profileFields.availability = availability;

    // Skills: accept array of {name, level} or comma-separated string
    if (skills) {
      if (Array.isArray(skills)) {
        profileFields.skills = skills;
      } else {
        profileFields.skills = skills.split(',').map(s => ({ name: s.trim(), level: 3 }));
      }
    }

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
        return res.json(profile);
      }
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route  GET api/profile
// @desc   Get all profiles
// @access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/profile/user/:user_id
// @desc   Get profile by user ID
// @access Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
    if (!profile) return res.status(400).json({ msg: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(400).json({ msg: 'Profile not found' });
    res.status(500).send('Server error');
  }
});

// @route  GET api/profile/match/:skills
// @desc   Get matched profiles by skills (comma-separated)
// @access Private
router.get('/match/:skills', auth, async (req, res) => {
  try {
    const skillList = req.params.skills.split(',').map(s => s.trim().toLowerCase());
    const profiles = await Profile.find({
      'skills.name': { $in: skillList.map(s => new RegExp(s, 'i')) }
    }).populate('user', ['name', 'avatar']);
    // Exclude current user
    const filtered = profiles.filter(p => p.user._id.toString() !== req.user.id);
    res.json(filtered);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/profile/experience
// @desc   Add profile experience
// @access Private
router.put('/experience', [auth, [
  check('title', 'Title is required').not().isEmpty(),
  check('company', 'Company is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, company, location, from, to, current, description } = req.body;
  const newExp = { title, company, location, from, to, current, description };

  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.experience.unshift(newExp);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/profile/education
// @desc   Add profile education
// @access Private
router.put('/education', [auth, [
  check('school', 'School is required').not().isEmpty(),
  check('degree', 'Degree is required').not().isEmpty(),
  check('fieldofstudy', 'Field of study is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { school, degree, fieldofstudy, from, to, current, description } = req.body;
  const newEdu = { school, degree, fieldofstudy, from, to, current, description };

  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.education.unshift(newEdu);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  DELETE api/profile/experience/:exp_id
// @desc   Delete experience from profile
// @access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.experience = profile.experience.filter(exp => exp._id.toString() !== req.params.exp_id);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  DELETE api/profile/education/:edu_id
// @desc   Delete education from profile
// @access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.education = profile.education.filter(edu => edu._id.toString() !== req.params.edu_id);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  DELETE api/profile
// @desc   Delete profile, user & data
// @access Private
router.delete('/', auth, async (req, res) => {
  try {
    const Project = require('../../models/Project');
    const Room = require('../../models/Room');
    const Doubt = require('../../models/Doubt');
    await Project.deleteMany({ user: req.user.id });
    await Room.deleteMany({ creator: req.user.id });
    await Doubt.deleteMany({ user: req.user.id });
    await Profile.findOneAndDelete({ user: req.user.id });
    await User.findByIdAndDelete(req.user.id);
    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  PUT api/profile/avatar
// @desc   Update user avatar
// @access Private
router.put('/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ msg: 'Avatar required' });

    

    const result = await cloudinary.uploader.upload(avatar, {
      folder: 'devforge',
      width: 200,
      height: 200,
      crop: 'fill',
    });

    await User.findByIdAndUpdate(req.user.id, { avatar: result.secure_url });
    res.json({ msg: 'Avatar updated', avatar: result.secure_url });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/profile/leetcode/:username
// @desc   Get LeetCode stats for a user
// @access Public
router.get('/leetcode/:username', async (req, res) => {
  try {
    const axios = require('axios');
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          submitStats {
            acSubmissionNum {
              difficulty
              count
            }
          }
          userCalendar {
            streak
          }
        }
      }
    `;
    const response = await axios.post(
      'https://leetcode.com/graphql',
      { query, variables: { username: req.params.username } },
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com',
          'User-Agent': 'Mozilla/5.0',
        }
      }
    );
    const user = response.data?.data?.matchedUser;
    if (!user) return res.status(404).json({ msg: 'LeetCode user not found' });

    const stats = user.submitStats.acSubmissionNum;
    const easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
    const medium = stats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;
    const solved = stats.find(s => s.difficulty === 'All')?.count || 0;
    const streak = user.userCalendar?.streak || 0;

    res.json({ solved, easy, medium, hard, streak });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Failed to fetch LeetCode stats' });
  }
});
module.exports = router;