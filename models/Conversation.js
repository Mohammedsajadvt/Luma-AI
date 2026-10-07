import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'New Chat',
    trim: true,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Auto-update updatedAt on save
ConversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
