const mongoose = require('mongoose');

// Stores platform-wide activity events for the live feed.
// type is one of: 'project_posted' | 'doubt_posted' | 'project_applied'
const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['project_posted', 'doubt_posted', 'project_applied'],
    required: true
  },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  // Generic ref fields — we store title/name inline so the feed
  // never needs a second DB lookup when rendering
  meta: {
    projectId:    String,
    projectTitle: String,
    doubtId:      String,
    doubtTitle:   String,
  },
  createdAt: { type: Date, default: Date.now }
});

ActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('activity', ActivitySchema);
