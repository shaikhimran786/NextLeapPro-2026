export const PLACEHOLDER_IMAGE = "/placeholders/no-image.svg";
export const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80";

export function isValidImageSrc(src: string | null | undefined): src is string {
  if (!src) return false;
  if (typeof src !== "string") return false;
  if (src.trim() === "") return false;
  return true;
}

export function getImageUrl(src: string | null | undefined): string {
  if (!isValidImageSrc(src)) {
    return PLACEHOLDER_IMAGE;
  }
  // Convert Unsplash photo page URLs to placeholder
  if (src.includes("unsplash.com/photos/")) {
    return DEFAULT_IMAGE;
  }
  if (src.startsWith("/objects/")) {
    return `/api${src}`;
  }
  return src;
}

export function resolveImageSrc(src: string | null | undefined): string {
  if (isValidImageSrc(src)) {
    return getImageUrl(src);
  }
  return PLACEHOLDER_IMAGE;
}

export function getImageFallbackProps(src: string | null | undefined) {
  const resolvedSrc = resolveImageSrc(src);
  const isPlaceholder = resolvedSrc === PLACEHOLDER_IMAGE;
  
  return {
    src: resolvedSrc,
    isPlaceholder,
  };
}
