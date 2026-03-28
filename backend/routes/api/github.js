const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../../middleware/auth');

// @route  GET api/github/:username
// @desc   Get GitHub repos for a user
// @access Public
router.get('/:username', async (req, res) => {
  try {
    const headers = { 'User-Agent': 'DevForge-App' };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
    const response = await axios.get(
      `https://api.github.com/users/${req.params.username}/repos?sort=updated&per_page=8`,
      { headers }
    );
    res.json(response.data);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ msg: 'GitHub user not found' });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route  GET api/github/profile/:username
// @desc   Get GitHub user profile info
// @access Public
router.get('/profile/:username', async (req, res) => {
  try {
    const headers = { 'User-Agent': 'DevForge-App' };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
    const response = await axios.get(
      `https://api.github.com/users/${req.params.username}`,
      { headers }
    );
    res.json(response.data);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ msg: 'GitHub user not found' });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
