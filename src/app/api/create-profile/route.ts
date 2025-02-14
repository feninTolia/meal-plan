import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: 'User not found in ' }, { status: 404 });
  }

  const email = clerkUser?.emailAddresses[0].emailAddress ?? '';
  if (!email) {
    return NextResponse.json(
      { error: 'User does not have email address' },
      { status: 400 }
    );
  }

  const existingProfile = Prisma.profile;
}
