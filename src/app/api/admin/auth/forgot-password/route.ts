import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    if (!user) {
      return NextResponse.json({
        message: "If an admin account exists with this email, a password reset link has been sent.",
      });
    }

    const isAdmin = user.roles.some(
      (role) => role.name.toLowerCase() === "admin"
    );

    if (!isAdmin) {
      return NextResponse.json({
        message: "If an admin account exists with this email, a password reset link has been sent.",
      });
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");
    const resetLink = `${baseUrl}/admin/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    console.log("=".repeat(60));
    console.log("ADMIN PASSWORD RESET LINK");
    console.log("=".repeat(60));
    console.log(`Email: ${email}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log("=".repeat(60));

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            to: email,
            subject: "Next Leap Pro - Admin Password Reset",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e293b;">Password Reset Request</h2>
                <p>You requested a password reset for your Next Leap Pro admin account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #FF0099, #0066FF); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
                <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour.</p>
                <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
              </div>
            `,
          }),
        });

        if (!response.ok) {
          console.error("Resend email failed:", await response.text());
        } else {
          console.log("Password reset email sent successfully via Resend");
        }
      } catch (emailError) {
        console.error("Failed to send email via Resend:", emailError);
      }
    } else {
      console.log("RESEND_API_KEY not configured - email not sent (check console for reset link)");
    }

    return NextResponse.json({
      message: "If an admin account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
