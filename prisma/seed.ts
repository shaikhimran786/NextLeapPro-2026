import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin", description: "Administrator with full access" },
  });

  const studentRole = await prisma.role.upsert({
    where: { name: "student" },
    update: {},
    create: { name: "student", description: "Student user" },
  });

  const mentorRole = await prisma.role.upsert({
    where: { name: "mentor" },
    update: {},
    create: { name: "mentor", description: "Mentor providing services" },
  });

  const organizerRole = await prisma.role.upsert({
    where: { name: "organizer" },
    update: {},
    create: { name: "organizer", description: "Event organizer" },
  });

  // Create admin user
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@nextleappro.com" },
    update: {},
    create: {
      email: "admin@nextleappro.com",
      passwordHash: adminPasswordHash,
      firstName: "Admin",
      lastName: "User",
      roles: { connect: [{ id: adminRole.id }] },
      subscriptionTier: "enterprise",
    },
  });

  // Create sample users
  const userPassword = await bcrypt.hash("password123", 10);
  
  const mentor1 = await prisma.user.upsert({
    where: { email: "priya@example.com" },
    update: {},
    create: {
      email: "priya@example.com",
      passwordHash: userPassword,
      firstName: "Priya",
      lastName: "Sharma",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
      bio: "Senior Software Engineer with 10+ years of experience",
      skills: ["React", "Node.js", "TypeScript", "System Design"],
      roles: { connect: [{ id: mentorRole.id }, { id: organizerRole.id }] },
      subscriptionTier: "pro",
    },
  });

  const mentor2 = await prisma.user.upsert({
    where: { email: "rahul@example.com" },
    update: {},
    create: {
      email: "rahul@example.com",
      passwordHash: userPassword,
      firstName: "Rahul",
      lastName: "Verma",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul",
      bio: "Product Designer at a leading startup",
      skills: ["UI/UX", "Figma", "Product Strategy", "Design Systems"],
      roles: { connect: [{ id: mentorRole.id }] },
      subscriptionTier: "creator",
    },
  });

  // Create site settings
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      siteName: "Next Leap Pro",
      slogan: "Learn, Earn, and Grow",
      defaultCurrency: "INR",
      heroTitle: "Learn. Earn. And Grow.",
      heroSubtitle: "The platform for students and professionals to master new skills, monetize their talents, and accelerate their career growth through community and events.",
      heroCTA: "Get Started",
      analyticsEnabled: true,
      seoDefaults: {
        title: "Next Leap Pro - Learn, Earn, and Grow",
        description: "The platform for students and professionals to master new skills, monetize their talents, and accelerate their career growth.",
      },
    },
  });

  // Create content blocks for landing page
  await prisma.contentBlock.createMany({
    skipDuplicates: true,
    data: [
      {
        page: "home",
        slug: "hero-section",
        title: "Hero Section",
        body: "The Ultimate Career Ecosystem",
        sortOrder: 1,
        visible: true,
      },
      {
        page: "home",
        slug: "features-section",
        title: "Features",
        body: "Everything you need to succeed",
        sortOrder: 2,
        visible: true,
      },
      {
        page: "home",
        slug: "cta-section",
        title: "Call to Action",
        body: "Ready to take the next leap?",
        sortOrder: 3,
        visible: true,
      },
    ],
  });

  // Create page meta for SEO
  await prisma.pageMeta.createMany({
    skipDuplicates: true,
    data: [
      {
        page: "home",
        title: "Next Leap Pro - Learn, Earn, and Grow",
        description: "The platform for students and professionals to master new skills, monetize their talents, and accelerate their career growth.",
      },
      {
        page: "events",
        title: "Events - Next Leap Pro",
        description: "Discover workshops, webinars, bootcamps, and conferences to upskill your career.",
      },
      {
        page: "services",
        title: "Services - Next Leap Pro",
        description: "Find mentors, coaches, and professionals to help you grow.",
      },
      {
        page: "communities",
        title: "Communities - Next Leap Pro",
        description: "Join communities of like-minded professionals and grow together.",
      },
      {
        page: "pricing",
        title: "Pricing - Next Leap Pro",
        description: "Choose the plan that fits your needs. Start free, upgrade anytime.",
      },
    ],
  });

  // Create feature toggles
  await prisma.featureToggle.createMany({
    skipDuplicates: true,
    data: [
      { key: "events", name: "Events Module", description: "Enable events and workshops", enabled: true },
      { key: "services", name: "Services Marketplace", description: "Enable services marketplace", enabled: true },
      { key: "communities", name: "Communities", description: "Enable communities feature", enabled: true },
      { key: "subscriptions", name: "Subscriptions", description: "Enable subscription plans", enabled: true },
      { key: "analytics", name: "Analytics Dashboard", description: "Enable analytics for users", enabled: false },
      { key: "ai_assistant", name: "AI Assistant", description: "Enable AI-powered features", enabled: false },
    ],
  });

  // Create events
  await prisma.event.createMany({
    skipDuplicates: true,
    data: [
      {
        title: "Full Stack Development Bootcamp 2025",
        description: "Join us for an intensive one-day bootcamp designed to take your full stack development skills to the next level. Whether you're a beginner looking to get started or an intermediate developer aiming to refine your stack, this workshop covers it all.",
        coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
        category: "Workshop",
        tags: ["React", "Node.js", "PostgreSQL"],
        level: "intermediate",
        eventType: "Bootcamp",
        mode: "online",
        startDate: new Date("2025-01-15T10:00:00Z"),
        endDate: new Date("2025-01-15T16:00:00Z"),
        timezone: "IST",
        capacity: 50,
        price: 3999,
        currency: "INR",
        onlineLink: "https://zoom.us/j/example",
        status: "published",
        organizerId: mentor1.id,
      },
      {
        title: "Product Design Leadership Summit",
        description: "Learn from industry leaders about the future of product design and UX. This conference brings together the best minds in design.",
        coverImage: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800",
        category: "Conference",
        tags: ["Design", "Leadership", "UX"],
        level: "advanced",
        eventType: "Conference",
        mode: "offline",
        startDate: new Date("2025-02-02T09:00:00Z"),
        endDate: new Date("2025-02-02T17:00:00Z"),
        timezone: "IST",
        capacity: 200,
        price: 24999,
        currency: "INR",
        venue: "Bengaluru Convention Center",
        status: "published",
        organizerId: mentor2.id,
      },
      {
        title: "AI for Marketing Professionals",
        description: "Discover how AI is transforming marketing and learn practical strategies to stay ahead.",
        coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
        category: "Webinar",
        tags: ["AI", "Marketing", "Automation"],
        level: "beginner",
        eventType: "Webinar",
        mode: "online",
        startDate: new Date("2025-01-10T14:00:00Z"),
        endDate: new Date("2025-01-10T15:30:00Z"),
        timezone: "IST",
        price: 0,
        currency: "INR",
        onlineLink: "https://meet.google.com/example",
        status: "published",
        organizerId: mentor1.id,
      },
    ],
  });

  // Create communities
  await prisma.community.createMany({
    skipDuplicates: true,
    data: [
      {
        name: "React Developers",
        slug: "react-developers",
        description: "The largest community for React enthusiasts. Share knowledge, get help, and connect with fellow React developers.",
        logo: "https://api.dicebear.com/7.x/shapes/svg?seed=react",
        category: "Technology",
        tags: ["React", "JavaScript", "Frontend"],
        location: "Global",
      },
      {
        name: "UI/UX Designers",
        slug: "ui-ux-designers",
        description: "Share designs, get feedback, learn from the best designers, and grow together.",
        logo: "https://api.dicebear.com/7.x/shapes/svg?seed=design",
        category: "Design",
        tags: ["Design", "UX", "Figma"],
        location: "Global",
      },
      {
        name: "Startup Founders",
        slug: "startup-founders",
        description: "Connect with founders, share your journey, and get advice from experienced entrepreneurs.",
        logo: "https://api.dicebear.com/7.x/shapes/svg?seed=startup",
        category: "Business",
        tags: ["Startups", "Entrepreneurship", "Funding"],
        location: "Global",
      },
      {
        name: "Data Scientists",
        slug: "data-scientists",
        description: "Machine learning, AI, big data - discuss the latest trends and share your work.",
        logo: "https://api.dicebear.com/7.x/shapes/svg?seed=data",
        category: "Technology",
        tags: ["Data Science", "ML", "AI"],
        location: "Global",
      },
    ],
  });

  // Create services
  await prisma.service.createMany({
    skipDuplicates: true,
    data: [
      {
        title: "1-on-1 Career Mentorship Session",
        description: "Get personalized career advice from an experienced professional. 60-minute session covering resume review, interview prep, and career strategy.",
        coverImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600",
        providerId: mentor1.id,
        category: "Mentorship",
        price: 4999,
        currency: "INR",
        deliveryType: "online",
        rating: 4.8,
        reviewCount: 24,
      },
      {
        title: "Professional Logo & Brand Identity Design",
        description: "Complete branding package including logo, colors, typography, and style guide for your business or personal brand.",
        coverImage: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600",
        providerId: mentor2.id,
        category: "Design",
        price: 24999,
        currency: "INR",
        deliveryType: "online",
        rating: 4.9,
        reviewCount: 32,
      },
    ],
  });

  // Create subscription plans
  await prisma.subscriptionPlan.createMany({
    skipDuplicates: true,
    data: [
      {
        name: "Free",
        description: "For students just starting out",
        price: 0,
        currency: "INR",
        interval: "month",
        intervalCount: 1,
        features: ["Browse all events", "Join free community events", "Access public communities", "Basic profile"],
        tier: "free",
        planCode: "plan_free",
        trialDays: 0,
        sortOrder: 0,
        isPopular: false,
        active: true,
      },
      {
        name: "Pro",
        description: "For serious learners & professionals",
        price: 1499,
        currency: "INR",
        interval: "month",
        intervalCount: 1,
        features: ["Everything in Free", "Access premium events", "Event recordings", "Certificates of completion", "Exclusive job board", "Priority support"],
        tier: "pro",
        planCode: "plan_pro_monthly",
        trialDays: 7,
        sortOrder: 1,
        isPopular: true,
        active: true,
      },
      {
        name: "Creator",
        description: "For mentors, organizers & speakers",
        price: 3999,
        currency: "INR",
        interval: "month",
        intervalCount: 1,
        features: ["Everything in Pro", "Host unlimited events", "Create paid workshops", "Community analytics", "Custom branding", "Monetization tools"],
        tier: "creator",
        planCode: "plan_creator_monthly",
        trialDays: 7,
        sortOrder: 2,
        isPopular: false,
        active: true,
      },
      {
        name: "Pro Annual",
        description: "For serious learners & professionals - Save 20%",
        price: 14388,
        currency: "INR",
        interval: "year",
        intervalCount: 1,
        features: ["Everything in Free", "Access premium events", "Event recordings", "Certificates of completion", "Exclusive job board", "Priority support", "20% annual discount"],
        tier: "pro_annual",
        planCode: "plan_pro_annual",
        trialDays: 7,
        sortOrder: 3,
        isPopular: false,
        active: true,
      },
      {
        name: "Creator Annual",
        description: "For mentors, organizers & speakers - Save 20%",
        price: 38388,
        currency: "INR",
        interval: "year",
        intervalCount: 1,
        features: ["Everything in Pro", "Host unlimited events", "Create paid workshops", "Community analytics", "Custom branding", "Monetization tools", "20% annual discount"],
        tier: "creator_annual",
        planCode: "plan_creator_annual",
        trialDays: 7,
        sortOrder: 4,
        isPopular: false,
        active: true,
      },
    ],
  });

  // Create currencies
  await prisma.currency.createMany({
    skipDuplicates: true,
    data: [
      { code: "INR", name: "Indian Rupee", symbol: "₹", enabled: true, isDefault: true },
      { code: "USD", name: "US Dollar", symbol: "$", enabled: true, isDefault: false },
      { code: "EUR", name: "Euro", symbol: "€", enabled: false, isDefault: false },
      { code: "GBP", name: "British Pound", symbol: "£", enabled: false, isDefault: false },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
