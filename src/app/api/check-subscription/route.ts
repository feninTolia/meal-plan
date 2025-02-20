import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.nextUrl);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const profile = await prisma?.profile.findUnique({
      where: { userId },
      select: { subscriptionActive: true },
    });

    return NextResponse.json({
      subscriptionActive: profile?.subscriptionActive,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
