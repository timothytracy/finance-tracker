// app/actions/auth.ts
'use server'

import bcrypt from 'bcrypt';
import prisma from '@/prisma/PrismaClient';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';

export async function registerUser(formData: FormData) {
'use server';

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  
  // Validate inputs
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    return { error: 'User with this email already exists' };
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });
  
  // Redirect to login page
  redirect('/login?registered=true');
}
export async function getCurrentUserId() {
  const session = await getServerSession(authOptions)
  console.log('Session:', session)
  
  if (!session || !session.user || !session.user.id) {
    throw new Error('You must be logged in to perform this action')
  }
  
  return session.user.id
}