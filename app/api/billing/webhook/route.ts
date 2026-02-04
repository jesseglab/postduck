import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { prisma } from "@/lib/db/prisma";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const teamId = session.metadata?.teamId;

        if (!teamId) {
          console.error("No teamId in checkout session metadata");
          break;
        }

        const subscriptionId = session.subscription as string;
        if (!subscriptionId) {
          console.error("No subscription ID in checkout session");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );

        await prisma.subscription.update({
          where: { teamId },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripePriceId: subscription.items.data[0]?.price.id || null,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (dbSubscription) {
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0]?.price.id || null,
              status: subscription.status,
              currentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
            },
          });
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (dbSubscription) {
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: "canceled",
              stripeSubscriptionId: null,
              currentPeriodEnd: null,
            },
          });
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (dbSubscription) {
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: "past_due",
            },
          });
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Webhook handler failed",
      },
      { status: 500 }
    );
  }
}
