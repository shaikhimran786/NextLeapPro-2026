import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAccess } from "@/lib/auth-utils";
import { objectStorageService, ObjectNotFoundError } from "@/lib/object-storage";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/referral-hires/cvs/[id]/download?disposition=inline|attachment
 * Admin-only gated streaming of a candidate CV. Candidate CVs are never served
 * through the public /objects route in the UI; access goes through this guard.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const cvId = Number(id);
    if (!Number.isFinite(cvId)) {
      return NextResponse.json({ error: "Invalid CV id" }, { status: 400 });
    }

    const cv = await prisma.uploadedCv.findUnique({ where: { id: cvId } });
    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const objectFile = await objectStorageService.getObjectEntityFile(cv.fileUrl);
    const [metadata] = await objectFile.getMetadata();

    const readStream = objectFile.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of readStream) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    const disposition = request.nextUrl.searchParams.get("disposition") === "inline"
      ? "inline"
      : "attachment";
    const safeName = cv.fileName.replace(/[^\w.\- ]+/g, "_") || "cv";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": metadata.contentType || cv.fileType || "application/octet-stream",
        "Content-Length": String(metadata.size || buffer.length),
        "Content-Disposition": `${disposition}; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      return NextResponse.json({ error: "CV file not found in storage" }, { status: 404 });
    }
    console.error("CV download error:", error);
    return NextResponse.json({ error: "Failed to download CV" }, { status: 500 });
  }
}
