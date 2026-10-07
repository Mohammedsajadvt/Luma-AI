import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    default: 'gpt-4o-mini',
  },
  attachment: {
    name: String,
    type: String,
    size: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
