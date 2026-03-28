const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  title: { type: String, required: true },
  description: { type: String },
  goal: { type: String },
  deadline: { type: Date },
  techStack: [String],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  tasks: [{
    id: String,
    title: String,
    description: String,
    status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
    assignee: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('room', RoomSchema);
