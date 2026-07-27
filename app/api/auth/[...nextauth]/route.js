import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const lowerEmail = credentials.email.toLowerCase().trim();
        const db = await connectDB();

        let userFound = null;

        if (db && db.isFallback) {
          userFound = global.inMemoryDb.users.find((u) => u.email === lowerEmail);
        } else {
          try {
            userFound = await User.findOne({ email: lowerEmail });
          } catch (e) {
            userFound = global.inMemoryDb.users.find((u) => u.email === lowerEmail);
          }
        }

        if (!userFound || !userFound.isActive) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, userFound.passwordHash);
        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: userFound._id ? userFound._id.toString() : 'demo_id',
          email: userFound.email,
          name: userFound.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/signup',
  },
  secret: process.env.NEXTAUTH_SECRET || 'development_nextauth_secret_key_32bytes_long!!',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
