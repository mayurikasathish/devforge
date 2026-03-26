const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  company: { type: String },
  website: { type: String },
  location: { type: String },
  status: { type: String, required: true },
  skills: [{ name: String, level: { type: Number, min: 1, max: 5, default: 3 } }],
  bio: { type: String },
  githubusername: { type: String },
  leetcodeusername: { type: String },
  availability: {
    type: String,
    enum: ['available', 'busy', 'open_to_collaborate'],
    default: 'available'
  },
  experience: [{
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    from: { type: Date, required: true },
    to: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String }
  }],
  education: [{
    school: { type: String, required: true },
    degree: { type: String, required: true },
    fieldofstudy: { type: String, required: true },
    from: { type: Date, required: true },
    to: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String }
  }],
  social: {
    youtube: { type: String },
    twitter: { type: String },
    facebook: { type: String },
    linkedin: { type: String },
    instagram: { type: String }
  },
  weeklyProgress: [{
    week: { type: Date },
    skillsImproved: [String],
    doubtsAnswered: { type: Number, default: 0 },
    projectsContributed: { type: Number, default: 0 }
  }],
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('profile', ProfileSchema);
