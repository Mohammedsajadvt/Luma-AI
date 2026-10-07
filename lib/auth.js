import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectToDatabase from './mongodb';
import User from '@/models/User';

const providers = [];

// MongoDB User Authentication with Password
providers.push(
  CredentialsProvider({
    id: 'credentials',
    name: 'Account Sign In',
    credentials: {
      name: { label: "Name", type: "text" },
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const email = (credentials?.email || '').trim().toLowerCase();
      const name = (credentials?.name || '').trim();
      const password = (credentials?.password || '').trim();

      if (!email) {
        throw new Error('Email is required');
      }

      try {
        await connectToDatabase();
        let user = await User.findOne({ email });

        if (!user) {
          // Create new user account
          const displayName = name || email.split('@')[0];
          const hashedPassword = password ? bcrypt.hashSync(password, 10) : undefined;

          user = await User.create({
            email,
            name: displayName,
            password: hashedPassword,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`,
            lastLoginAt: new Date(),
          });
        } else {
          // Existing user - check password if user has password set
          if (user.password && password) {
            const isValid = bcrypt.compareSync(password, user.password);
            if (!isValid) {
              throw new Error('Invalid password for this account');
            }
          } else if (!user.password && password) {
            // First time setting password
            user.password = bcrypt.hashSync(password, 10);
          }

          if (name && name !== user.name) {
            user.name = name;
          }
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
        console.error('Auth error:', err.message);
        throw new Error(err.message || 'Authentication failed');
      }
    }
  })
);

export const authOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET || 'luma_ai_default_secret_key_change_in_prod_32chars',
  session: {
    strategy: 'jwt',
  },
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
};


