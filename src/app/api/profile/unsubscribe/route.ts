import { stripe } from '@/lib/stripe';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma?.profile.findUnique({
      where: { userId: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json({ error: 'No Profile Found' }, { status: 404 });
    }
    if (!profile.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No Active Subscription Found' },
        { status: 404 }
      );
    }

    const subscriptionId = profile.stripeSubscriptionId;

    const cancelSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    await prisma?.profile.update({
      where: { userId: clerkUser.id },
      data: {
        subscriptionTier: null,
        stripeSubscriptionId: null,
        subscriptionActive: false,
      },
    });
    return NextResponse.json({ subscription: cancelSubscription });
  } catch {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
