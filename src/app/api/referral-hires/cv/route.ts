import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { objectStorageService } from "@/lib/object-storage";
import { getCurrentUserId } from "@/lib/auth-utils";
import { isAllowedCvFile, getFileExtension } from "@/lib/referral-hires";

export const dynamic = "force-dynamic";

/**
 * POST /api/referral-hires/cv
 * Returns a short-lived signed URL the client uses to PUT the CV directly to
 * object storage. Works for both registered users (session) and guests.
 *
 * The returned `objectPath` is later passed back when the application or talent
 * submission is created; the server then persists an UploadedCv row pointing to
 * it. CV object paths are never exposed publicly — only the admin download route
 * streams them.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const fileName: string = typeof body.fileName === "string" ? body.fileName : "";
    const fileType: string | undefined = typeof body.fileType === "string" ? body.fileType : undefined;

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    if (!isAllowedCvFile(fileName, fileType)) {
      return NextResponse.json(
        { error: "Only PDF, DOC, and DOCX files are allowed" },
        { status: 400 }
      );
    }

    const userId = await getCurrentUserId();
    // Registered uploads are namespaced by userId; guests get a random scope id.
    const scopeId = userId ? `user-${userId}` : `guest-${nanoid(12)}`;

    const { uploadURL, objectPath } = await objectStorageService.getUploadURL(
      "referral-cvs",
      scopeId,
      "document"
    );

    return NextResponse.json({
      uploadURL,
      objectPath,
      extension: getFileExtension(fileName),
    });
  } catch (error) {
    console.error("CV upload URL error:", error);
    return NextResponse.json(
      { error: "Failed to prepare CV upload. Please try again." },
      { status: 500 }
    );
  }
}
