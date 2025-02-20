import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature ?? '',
      webhookSecret
    );
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case 'invoice.payment_failed': {
        const session = event.data.object;
        await handleInvoicePaymentFailed(session);
        break;
      }
      case 'customer.subscription.deleted': {
        const session = event.data.object;
        await handleCustomerSubscriptionDeleted(session);
        break;
      }
      default: {
        console.log(
          { error: 'Unhandled event type - ' + event.type },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({});
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.clerkUserId;
  if (!userId) {
    console.log('No Clerk User Id');
    return;
  }

  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    console.log('No Subscription  Id');
    return;
  }

  try {
    await prisma.profile.update({
      where: { userId },
      data: {
        stripeSubscriptionId: subscriptionId,
        subscriptionActive: true,
        subscriptionTier: session.metadata?.planType ?? null,
      },
    });
  } catch (error) {
    console.log(error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subId = invoice.subscription as string;

  if (!subId) {
    return;
  }

  let userId: string | undefined;
  try {
    const profile = await prisma.profile.findUnique({
      where: { stripeSubscriptionId: subId },
      select: { userId: true },
    });

    if (!profile?.userId) {
      console.log('No profile found');
      return;
    }
    userId = profile.userId;
  } catch (error) {
    console.log(error);
    return;
  }

  try {
    await prisma.profile.update({
      where: { userId },
      data: { subscriptionActive: false },
    });
  } catch (error) {
    console.log(error);
  }
}

async function handleCustomerSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const subId = subscription.id;

  let userId: string | undefined;
  try {
    const profile = await prisma.profile.findUnique({
      where: { stripeSubscriptionId: subId },
      select: { userId: true },
    });

    if (!profile?.userId) {
      console.log('No profile found');
      return;
    }
    userId = profile.userId;
  } catch (error) {
    console.log(error);
    return;
  }

  try {
    await prisma.profile.update({
      where: { userId },
      data: {
        subscriptionActive: false,
        stripeSubscriptionId: null,
        subscriptionTier: null,
      },
    });
  } catch (error) {
    console.log(error);
  }
}
