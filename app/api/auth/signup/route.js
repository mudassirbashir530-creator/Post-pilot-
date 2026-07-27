import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import { signupSchema } from '@/lib/utils';

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Zod Validation
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;
    const lowerEmail = email.toLowerCase().trim();

    const db = await connectDB();

    // In-Memory Fallback DB Path
    if (db && db.isFallback) {
      const existingUser = global.inMemoryDb.users.find((u) => u.email === lowerEmail);
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email address already exists' },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = {
        _id: 'user_' + Date.now(),
        name,
        email: lowerEmail,
        passwordHash,
        isActive: true,
        createdAt: new Date(),
      };

      global.inMemoryDb.users.push(newUser);

      return NextResponse.json(
        {
          message: 'Account created successfully',
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
          },
        },
        { status: 201 }
      );
    }

    // Mongoose DB Path
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email: lowerEmail,
      passwordHash,
      isActive: true,
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during signup' },
      { status: 500 }
    );
  }
}
