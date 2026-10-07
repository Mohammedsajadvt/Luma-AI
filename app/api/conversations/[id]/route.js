import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const userId = session.user.id || session.user.email;

    await connectToDatabase();

    const conversation = await Conversation.findOne({ _id: id, userId }).lean();
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await Message.find({ conversationId: id, userId })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ conversation, messages });
  } catch (err) {
    console.error('Error fetching conversation messages:', err);
    return NextResponse.json({ error: 'Failed to fetch conversation', details: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const userId = session.user.id || session.user.email;
    const body = await request.json();

    await connectToDatabase();

    const updated = await Conversation.findOneAndUpdate(
      { _id: id, userId },
      { $set: body },
      { new: true }
    );

    return NextResponse.json({ conversation: updated });
  } catch (err) {
    console.error('Error updating conversation:', err);
    return NextResponse.json({ error: 'Failed to update conversation', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const userId = session.user.id || session.user.email;

    await connectToDatabase();

    await Conversation.deleteOne({ _id: id, userId });
    await Message.deleteMany({ conversationId: id, userId });

    return NextResponse.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    console.error('Error deleting conversation:', err);
    return NextResponse.json({ error: 'Failed to delete conversation', details: err.message }, { status: 500 });
  }
}
