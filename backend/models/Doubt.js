const mongoose = require('mongoose');

const DoubtSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  title: { type: String, required: true },
  body: { type: String, required: true },
  tags: [String],
  anonymous: { type: Boolean, default: true },
  answers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    text: { type: String, required: true },
    anonymous: { type: Boolean, default: false },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    date: { type: Date, default: Date.now }
  }],
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  views: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('doubt', DoubtSchema);
