import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function seedDemoAccounts() {
  console.log("Starting demo accounts seeding...");

  const password = "test@123";
  const passwordHash = await bcrypt.hash(password, 10);

  const proRole = await prisma.role.findUnique({ where: { name: "student" } });
  const creatorRole = await prisma.role.findUnique({ where: { name: "organizer" } });
  const mentorRole = await prisma.role.findUnique({ where: { name: "mentor" } });

  const proPlan = await prisma.subscriptionPlan.findUnique({ where: { tier: "pro" } });
  const creatorPlan = await prisma.subscriptionPlan.findUnique({ where: { tier: "creator" } });

  if (!proPlan || !creatorPlan) {
    console.error("Pro or Creator plan not found!");
    return;
  }

  const now = new Date();
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  let proUser = await prisma.user.findUnique({ where: { email: "pro@demo.com" } });
  
  if (!proUser) {
    proUser = await prisma.user.create({
      data: {
        email: "pro@demo.com",
        passwordHash,
        firstName: "Pro",
        lastName: "Learner",
        handle: "pro-learner",
        bio: "Demo Pro account for testing premium features",
        subscriptionTier: "pro",
        subscriptionExpiry: oneYearFromNow,
        onboardingStatus: "completed",
        isPublished: true,
        roles: proRole ? { connect: { id: proRole.id } } : undefined,
      },
    });
    console.log("Created Pro demo user:", proUser.email);
  } else {
    await prisma.user.update({
      where: { id: proUser.id },
      data: {
        passwordHash,
        subscriptionTier: "pro",
        subscriptionExpiry: oneYearFromNow,
      },
    });
    console.log("Updated existing Pro demo user:", proUser.email);
  }

  let creatorUser = await prisma.user.findUnique({ where: { email: "creator@demo.com" } });
  
  if (!creatorUser) {
    creatorUser = await prisma.user.create({
      data: {
        email: "creator@demo.com",
        passwordHash,
        firstName: "Creator",
        lastName: "Pro",
        handle: "creator-pro",
        bio: "Demo Creator account for testing creator features like event hosting",
        subscriptionTier: "creator",
        subscriptionExpiry: oneYearFromNow,
        onboardingStatus: "completed",
        isPublished: true,
        roles: {
          connect: [
            ...(creatorRole ? [{ id: creatorRole.id }] : []),
            ...(mentorRole ? [{ id: mentorRole.id }] : []),
          ],
        },
      },
    });
    console.log("Created Creator demo user:", creatorUser.email);
  } else {
    await prisma.user.update({
      where: { id: creatorUser.id },
      data: {
        passwordHash,
        subscriptionTier: "creator",
        subscriptionExpiry: oneYearFromNow,
      },
    });
    console.log("Updated existing Creator demo user:", creatorUser.email);
  }

  const existingProSub = await prisma.userSubscription.findFirst({
    where: { userId: proUser.id, status: "active" },
  });

  if (!existingProSub) {
    const proSubscription = await prisma.userSubscription.create({
      data: {
        userId: proUser.id,
        planId: proPlan.id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: oneYearFromNow,
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        userId: proUser.id,
        subscriptionId: proSubscription.id,
        cashfreeOrderId: `demo_order_pro_${Date.now()}`,
        cashfreePaymentId: `demo_pay_pro_${Date.now()}`,
        paymentGateway: "cashfree",
        amount: proPlan.price,
        currency: "INR",
        status: "captured",
        paymentMethod: "demo",
        metadata: {
          planId: proPlan.id,
          planCode: proPlan.planCode,
          demo: true,
        },
      },
    });
    console.log("Created Pro subscription and payment record");
  } else {
    console.log("Pro subscription already exists");
  }

  const existingCreatorSub = await prisma.userSubscription.findFirst({
    where: { userId: creatorUser.id, status: "active" },
  });

  if (!existingCreatorSub) {
    const creatorSubscription = await prisma.userSubscription.create({
      data: {
        userId: creatorUser.id,
        planId: creatorPlan.id,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: oneYearFromNow,
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        userId: creatorUser.id,
        subscriptionId: creatorSubscription.id,
        cashfreeOrderId: `demo_order_creator_${Date.now()}`,
        cashfreePaymentId: `demo_pay_creator_${Date.now()}`,
        paymentGateway: "cashfree",
        amount: creatorPlan.price,
        currency: "INR",
        status: "captured",
        paymentMethod: "demo",
        metadata: {
          planId: creatorPlan.id,
          planCode: creatorPlan.planCode,
          demo: true,
        },
      },
    });
    console.log("Created Creator subscription and payment record");
  } else {
    console.log("Creator subscription already exists");
  }

  console.log("\n=== Demo Accounts Created Successfully ===");
  console.log("Pro Account: pro@demo.com / test@123");
  console.log("Creator Account: creator@demo.com / test@123");
  console.log("==========================================\n");
}

seedDemoAccounts()
  .catch((e) => {
    console.error("Error seeding demo accounts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
