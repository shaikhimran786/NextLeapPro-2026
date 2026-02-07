"use client";

import { useState, useCallback } from "react";
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

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

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

  return (
    <>
      {isLoading && (
        <div 
          className={`animate-pulse bg-slate-200 ${className}`}
          style={props.fill ? { position: "absolute", inset: 0 } : { width: props.width, height: props.height }}
        />
      )}
      <Image
        src={resolvedSrc}
        alt={alt}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
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
