const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  techStack: [String],
  rolesNeeded: [String],
  skillsRequired: [String],
  duration: { type: String },
  status: { type: String, enum: ['open', 'in_progress', 'completed'], default: 'open' },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('project', ProjectSchema);
