import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.email;
    await connectToDatabase();

    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return NextResponse.json({ error: 'Failed to fetch conversations', details: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.email;
    const body = await request.json().catch(() => ({}));
    const title = body.title || 'New Chat';

    await connectToDatabase();

    const conversation = await Conversation.create({
      userId,
      title,
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (err) {
    console.error('Error creating conversation:', err);
    return NextResponse.json({ error: 'Failed to create conversation', details: err.message }, { status: 500 });
  }
}
