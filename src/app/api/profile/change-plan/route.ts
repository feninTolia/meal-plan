import { getPriceIdFromType } from '@/lib/plans';
import { stripe } from '@/lib/stripe';
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newPlan } = await request.json();

    if (!newPlan) {
      return NextResponse.json(
        { error: 'New plan is required' },
        { status: 400 }
      );
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

    const subscriptionItem = await stripe.subscriptions.retrieve(
      subscriptionId
    );
    const subscriptionItemId = subscriptionItem.items.data[0].id;

    if (!subscriptionItemId) {
      return NextResponse.json(
        { error: 'No Stripe Active Subscription Found' },
        { status: 404 }
      );
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: false,
        items: [{ id: subscriptionItemId, price: getPriceIdFromType(newPlan) }],
        proration_behavior: 'create_prorations',
      }
    );

    await prisma?.profile.update({
      where: { userId: clerkUser.id },
      data: {
        subscriptionTier: newPlan,
        stripeSubscriptionId: updatedSubscription.id,
        subscriptionActive: true,
      },
    });
    return NextResponse.json({ subscription: updatedSubscription });
  } catch {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
