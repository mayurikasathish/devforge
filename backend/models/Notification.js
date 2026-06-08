const mongoose = require('mongoose');

// Stores notifications for a specific user so they persist across sessions.
// Currently used for application accept/reject results.
const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
  type:      { type: String, required: true },
  message:   { type: String, required: true },
  read:      { type: Boolean, default: false },
  meta:      { projectId: String, projectTitle: String, roomId: String, roomTitle: String },
  createdAt: { type: Date, default: Date.now }
});

NotificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('notification', NotificationSchema);
