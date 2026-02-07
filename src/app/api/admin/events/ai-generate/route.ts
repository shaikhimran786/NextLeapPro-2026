import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";
import { generateEventContent, EventGenerationRequest } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { isAdmin, userId } = await checkAdminAccess();
    if (!isAdmin || !userId) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      templateId,
      topic,
      targetAudience,
      eventType,
      mode,
      duration,
      additionalContext
    } = body;

    if (!topic || !targetAudience || !eventType || !mode) {
      return NextResponse.json(
        { error: "Missing required fields: topic, targetAudience, eventType, mode" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    const aiRequest = await prisma.eventAIRequest.create({
      data: {
        requesterId: userId,
        templateId: templateId || null,
        requestPayload: { topic, targetAudience, eventType, mode, duration, additionalContext },
        status: "processing"
      }
    });

    try {
      const generatedContent = await generateEventContent({
        templateId,
        topic,
        targetAudience,
        eventType,
        mode,
        duration,
        additionalContext
      } as EventGenerationRequest);

      const processingTime = Date.now() - startTime;

      await prisma.eventAIRequest.update({
        where: { id: aiRequest.id },
        data: {
          generatedEventJson: generatedContent as any,
          status: "completed",
          processingTime,
          modelUsed: "gpt-4o"
        }
      });

      if (templateId) {
        await prisma.eventTemplate.update({
          where: { id: templateId },
          data: { usageCount: { increment: 1 } }
        });
      }

      await prisma.adminAuditLog.create({
        data: {
          userId,
          action: "ai_generate_event",
          target: `EventAIRequest:${aiRequest.id}`,
          details: { topic, eventType, processingTime }
        }
      });

      return NextResponse.json({
        success: true,
        requestId: aiRequest.id,
        generatedContent,
        processingTime
      });
    } catch (aiError: any) {
      await prisma.eventAIRequest.update({
        where: { id: aiRequest.id },
        data: {
          status: "failed",
          errorMessage: aiError.message || "AI generation failed"
        }
      });

      throw aiError;
    }
  } catch (error: any) {
    console.error("Error generating event content:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate event content" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const [templates, recentRequests] = await Promise.all([
      prisma.eventTemplate.findMany({
        where: { status: "active" },
        orderBy: { usageCount: "desc" },
        take: 20
      }),
      prisma.eventAIRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          template: true
        }
      })
    ]);

    return NextResponse.json({
      templates,
      recentRequests
    });
  } catch (error) {
    console.error("Error fetching AI generation data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
