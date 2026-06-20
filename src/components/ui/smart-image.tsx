"use client";

import { useState, useCallback, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { PLACEHOLDER_IMAGE, isValidImageSrc, getImageUrl } from "@/lib/image-utils";
import { ImageOff } from "@/lib/icons";

type FallbackType = "banner" | "avatar" | "logo" | "cover";

interface SmartImageProps extends Omit<ImageProps, "src" | "onError"> {
  src: string | null | undefined;
  fallbackType?: FallbackType;
  showIcon?: boolean;
}

export function SmartImage({
  src,
  alt,
  fallbackType = "banner",
  showIcon = true,
  className = "",
  ...props
}: SmartImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // When the optimized next/image fails (e.g. the host isn't listed in
  // next.config remotePatterns), retry once with a native <img>. The native
  // tag bypasses the Next image optimizer and its host allowlist, so a valid
  // remote logo still renders instead of collapsing to the "No Image"
  // placeholder. Only after the native <img> also fails do we treat the
  // image as genuinely broken.
  const [useNativeImg, setUseNativeImg] = useState(false);

  // Reset transient state whenever the source changes so a new logo gets a
  // fresh optimized attempt.
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setUseNativeImg(false);
  }, [src]);

  const handleError = useCallback(() => {
    if (!useNativeImg) {
      setUseNativeImg(true);
      setIsLoading(true);
      return;
    }
    setHasError(true);
    setIsLoading(false);
  }, [useNativeImg]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const shouldShowFallback = !isValidImageSrc(src) || hasError;

  if (shouldShowFallback) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 ${className}`}
        style={props.fill ? { position: "absolute", inset: 0 } : { width: props.width, height: props.height }}
      >
        {showIcon && (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <ImageOff className="h-8 w-8 opacity-50" />
            <span className="text-xs font-medium opacity-75">No Image</span>
          </div>
        )}
      </div>
    );
  }

  const resolvedSrc = getImageUrl(src);

  // Pull out next/image-only props so we can render a clean native <img>
  // fallback that still mimics `fill` layout.
  const { fill, width, height, sizes, priority, quality, placeholder, blurDataURL, loader, ...imgRest } =
    props as ImageProps & Record<string, unknown>;
  void sizes; void priority; void quality; void placeholder; void blurDataURL; void loader;

  return (
    <>
      {isLoading && (
        <div
          className={`animate-pulse bg-slate-200 ${className}`}
          style={fill ? { position: "absolute", inset: 0 } : { width, height }}
        />
      )}
      {useNativeImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt={typeof alt === "string" ? alt : ""}
          className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
          style={
            fill
              ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
              : { width, height }
          }
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
          {...(imgRest as React.ImgHTMLAttributes<HTMLImageElement>)}
        />
      ) : (
        <Image
          src={resolvedSrc}
          alt={alt}
          className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
          {...props}
        />
      )}
    </>
  );
}

interface SmartAvatarImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallbackIcon?: React.ReactNode;
}

export function SmartAvatarImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  fallbackIcon,
}: SmartAvatarImageProps) {
  const [hasError, setHasError] = useState(false);

  const shouldShowFallback = !isValidImageSrc(src) || hasError;

  if (shouldShowFallback) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-primary/10 to-blue-500/10 ${fallbackClassName}`}>
        {fallbackIcon || <ImageOff className="h-4 w-4 text-primary/40" />}
      </div>
    );
  }

  const resolvedSrc = getImageUrl(src);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

export function useFallbackImage(src: string | null | undefined) {
  const [hasError, setHasError] = useState(false);
  
  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  const shouldShowFallback = !isValidImageSrc(src) || hasError;
  const resolvedSrc = shouldShowFallback ? PLACEHOLDER_IMAGE : getImageUrl(src);

  return {
    src: resolvedSrc,
    onError: handleError,
    shouldShowFallback,
    isValid: !shouldShowFallback,
  };
}
