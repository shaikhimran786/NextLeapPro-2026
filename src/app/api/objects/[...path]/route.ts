import { NextRequest, NextResponse } from "next/server";
import { objectStorageService, ObjectNotFoundError } from "@/lib/object-storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const objectPath = `/objects/${path.join("/")}`;
    
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const [metadata] = await objectFile.getMetadata();
    
    const readStream = objectFile.createReadStream();
    const chunks: Buffer[] = [];
    
    for await (const chunk of readStream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": String(metadata.size || buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      return NextResponse.json({ error: "Object not found" }, { status: 404 });
    }
    console.error("Error serving object:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
