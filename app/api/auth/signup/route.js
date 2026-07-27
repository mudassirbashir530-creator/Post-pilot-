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

    await connectDB();

    // 2. Check for existing user
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 400 }
      );
    }

    // 3. Hash Password & Create User
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
      { error: 'An unexpected error occurred during signup' },
      { status: 500 }
    );
  }
}
