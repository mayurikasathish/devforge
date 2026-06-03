const mongoose = require('mongoose');

// Each document = one message in a conversation between two users.
// conversationId is a deterministic string built from both user IDs sorted,
// so we can query all messages between two users with a single index scan.

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  text:     { type: String, required: true, maxlength: 2000 },
  read:     { type: Boolean, default: false },
  createdAt:{ type: Date, default: Date.now }
});

// Compound index for fast pagination queries
MessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('message', MessageSchema);
