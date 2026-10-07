import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDatabase from './mongodb';
import User from '@/models/User';

const providers = [];

// Google OAuth Provider
providers.push(
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id_for_init',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret_for_init',
  })
);


// 1-Click MongoDB User Authentication
providers.push(
  CredentialsProvider({
    id: 'credentials',
    name: 'Account Sign In',
    credentials: {
      name: { label: "Name", type: "text", placeholder: "Alex Morgan" },
      email: { label: "Email", type: "email", placeholder: "alex@luma.ai" }
    },
    async authorize(credentials) {
      const email = (credentials?.email || 'alex.morgan@luma.ai').trim().toLowerCase();
      const name = (credentials?.name || 'Alex Morgan').trim();

      try {
        await connectToDatabase();
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            email,
            name,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
            lastLoginAt: new Date(),
          });
        } else {
          user.lastLoginAt = new Date();
          await user.save();
        }
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      } catch (err) {
        console.warn('MongoDB fallback auth:', err.message);
        return {
          id: 'demo-user-' + email.replace(/[^a-zA-Z0-9]/g, '_'),
          email,
          name,
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        };
      }
    }
  })
);

export const authOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await connectToDatabase();
          await User.findOneAndUpdate(
            { email: user.email.toLowerCase() },
            {
              email: user.email.toLowerCase(),
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId,
              lastLoginAt: new Date(),
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error('Error syncing Google user to DB:', err);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id || token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'luma_ai_default_secret_key_change_in_prod_32chars',
};

