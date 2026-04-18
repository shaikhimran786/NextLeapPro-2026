"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "@/lib/icons";

export type CropAspect = "square" | "banner" | "video";

interface ImageCropDialogProps {
  open: boolean;
  file: File | null;
  aspect: CropAspect;
  maxOutputSizeMB?: number;
  outputType?: "image/jpeg" | "image/webp" | "image/png";
  onCancel: () => void;
  onConfirm: (compressedFile: File) => void | Promise<void>;
}

const ASPECT_RATIOS: Record<CropAspect, number> = {
  square: 1,
  banner: 16 / 9,
  video: 16 / 9,
};

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

async function getCroppedBlob(
  imageSrc: string,
  cropArea: Area,
  outputType: string
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height,
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
      outputType,
      0.92,
    );
  });
}

export function ImageCropDialog({
  open,
  file,
  aspect,
  maxOutputSizeMB = 1,
  outputType = "image/jpeg",
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!open || !file) {
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, file]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const reset = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || !file) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedBlob(imageSrc, croppedAreaPixels, outputType);
      const croppedFile = new File(
        [croppedBlob],
        file.name.replace(/\.[^.]+$/, "") + (outputType === "image/png" ? ".png" : outputType === "image/webp" ? ".webp" : ".jpg"),
        { type: outputType },
      );
      const compressed = await imageCompression(croppedFile, {
        maxSizeMB: maxOutputSizeMB,
        maxWidthOrHeight: aspect === "banner" || aspect === "video" ? 1920 : 1024,
        useWebWorker: true,
        fileType: outputType,
        initialQuality: 0.85,
      });
      await onConfirm(compressed);
      reset();
    } catch (err) {
      console.error("Crop/compress error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleCancel();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
          <DialogDescription>
            Adjust the crop area below. The image will be compressed before upload.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-[360px] bg-slate-900 rounded-md overflow-hidden">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT_RATIOS[aspect]}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Zoom</label>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={(v) => setZoom(v[0] ?? 1)}
            data-testid="slider-crop-zoom"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || !imageSrc || !croppedAreaPixels}
            data-testid="button-crop-confirm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…
              </>
            ) : (
              "Crop & Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
