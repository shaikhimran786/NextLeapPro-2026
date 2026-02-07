import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { generateCareerInsights, CareerInsightRequest } from "@/lib/openai";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;

  const session = await prisma.session.findFirst({
    where: { token: sessionToken },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      skills,
      interests,
      currentRole,
      experienceLevel,
      learningGoals,
      careerAspirations,
      incomeGoals
    } = body;

    if (!skills || !interests || !learningGoals || !careerAspirations) {
      return NextResponse.json(
        { error: "Missing required fields: skills, interests, learningGoals, careerAspirations" },
        { status: 400 }
      );
    }

    let careerProfile = await prisma.careerProfile.findUnique({
      where: { userId: user.id }
    });

    if (!careerProfile) {
      careerProfile = await prisma.careerProfile.create({
        data: {
          userId: user.id,
          interests: interests,
          learningGoals: learningGoals,
          careerAspirations: careerAspirations,
          currentRole: currentRole,
          experienceLevel: experienceLevel,
          incomeGoals: incomeGoals
        }
      });
    } else {
      careerProfile = await prisma.careerProfile.update({
        where: { userId: user.id },
        data: {
          interests: interests,
          learningGoals: learningGoals,
          careerAspirations: careerAspirations,
          currentRole: currentRole,
          experienceLevel: experienceLevel,
          incomeGoals: incomeGoals
        }
      });
    }
    
    if (user.skills !== skills) {
      await prisma.user.update({
        where: { id: user.id },
        data: { skills }
      });
    }

    const startTime = Date.now();

    const aiInsights = await generateCareerInsights({
      skills,
      interests,
      currentRole,
      experienceLevel,
      learningGoals,
      careerAspirations,
      incomeGoals
    } as CareerInsightRequest);

    const processingTime = Date.now() - startTime;

    const insightsToCreate = [
      {
        careerProfileId: careerProfile.id,
        insightType: "career_path",
        title: aiInsights.careerPath.title,
        summary: aiInsights.careerPath.summary,
        actionsJson: {
          milestones: aiInsights.careerPath.milestones
        },
        priority: 1,
        sourceModel: "gpt-4o"
      },
      {
        careerProfileId: careerProfile.id,
        insightType: "skill_gaps",
        title: "Skill Development Areas",
        summary: `${aiInsights.skillGaps.filter(s => s.importance === "high").length} high-priority skills to develop`,
        actionsJson: {
          skillGaps: aiInsights.skillGaps
        },
        priority: 2,
        sourceModel: "gpt-4o"
      },
      {
        careerProfileId: careerProfile.id,
        insightType: "monetization",
        title: "Monetization Opportunities",
        summary: `${aiInsights.monetizationTips.length} ways to earn with your skills`,
        actionsJson: {
          tips: aiInsights.monetizationTips
        },
        priority: 3,
        sourceModel: "gpt-4o"
      },
      {
        careerProfileId: careerProfile.id,
        insightType: "recommendations",
        title: "Recommended Actions",
        summary: "Events and communities to explore",
        actionsJson: {
          events: aiInsights.recommendedEvents,
          communities: aiInsights.recommendedCommunities
        },
        priority: 4,
        sourceModel: "gpt-4o"
      }
    ];

    await prisma.careerInsight.deleteMany({
      where: { careerProfileId: careerProfile.id }
    });

    await prisma.careerInsight.createMany({
      data: insightsToCreate
    });

    const savedInsights = await prisma.careerInsight.findMany({
      where: { careerProfileId: careerProfile.id },
      orderBy: { priority: "asc" }
    });

    return NextResponse.json({
      success: true,
      careerProfile,
      insights: savedInsights,
      raw: aiInsights,
      processingTime
    });
  } catch (error: any) {
    console.error("Error generating career insights:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate career insights" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const careerProfile = await prisma.careerProfile.findUnique({
      where: { userId: user.id },
      include: {
        insights: {
          orderBy: { priority: "asc" }
        }
      }
    });

    return NextResponse.json({
      careerProfile,
      hasInsights: careerProfile?.insights && careerProfile.insights.length > 0
    });
  } catch (error) {
    console.error("Error fetching career insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch career insights" },
      { status: 500 }
    );
  }
}
