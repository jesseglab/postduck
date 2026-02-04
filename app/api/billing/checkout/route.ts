import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { stripe, STRIPE_PRICE_ID } from "@/lib/stripe";
import { canManageBilling } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await request.json();
    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Check if user is a member of the team and has billing permissions
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: session.user.id,
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 });
    }

    if (!canManageBilling(teamMember.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get or create Stripe customer
    let subscription = await prisma.subscription.findUnique({
      where: { teamId },
    });

    let customerId: string;
    if (subscription) {
      customerId = subscription.stripeCustomerId;
    } else {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { members: { include: { user: true } } },
      });

      if (!team) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: team.name,
        metadata: {
          teamId: team.id,
        },
      });

      customerId = customer.id;

      subscription = await prisma.subscription.create({
        data: {
          teamId: team.id,
          stripeCustomerId: customerId,
          status: "inactive",
        },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${
        request.headers.get("origin") || "http://localhost:3000"
      }/team/billing?success=true`,
      cancel_url: `${
        request.headers.get("origin") || "http://localhost:3000"
      }/team/billing?canceled=true`,
      metadata: {
        teamId,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
