import { notFound, permanentRedirect } from "next/navigation";
import { resolveCommunitySegment } from "@/lib/community-resolver";

export async function resolveCommunityIdForPage(
  rawSegment: string,
  subPath: string = "",
): Promise<number> {
  const result = await resolveCommunitySegment(rawSegment);
  if (result.kind === "not_found") {
    notFound();
  }
  if (result.kind === "redirect") {
    permanentRedirect(`/communities/${result.canonicalSlug ?? result.communityId}${subPath}`);
  }
  return result.communityId;
}
