/**
 * Media compression and validation utilities for Personal Memory
 * Enforces Firestore document size constraints (< 1 MB per document)
 */

export interface OptimizedMediaResult {
  dataUrl: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
}

export const MAX_SAFE_MEDIA_TOTAL_BYTES = 700 * 1024; // 700 KB safe limit per entry to leave room for text & metadata
export const MAX_SINGLE_MEDIA_BYTES = 650 * 1024;     // 650 KB limit per image

/**
 * Optimizes an image file by resizing and compressing using an HTML5 Canvas.
 * Compresses 2-10 MB camera photos down to ~100-300 KB without significant perceptible quality loss.
 */
export async function optimizeImage(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  initialQuality = 0.78
): Promise<OptimizedMediaResult> {
  return new Promise((resolve, reject) => {
    // Check if browser supports Image and Canvas
    if (!window.FileReader || !window.Image) {
      return reject(new Error('Browser image processing not supported'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image data format'));

      img.onload = () => {
        let { width, height } = img;

        // Calculate scaled dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas context could not be created'));
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first if supported, fallback to JPEG
        let mimeType = 'image/jpeg';
        let quality = initialQuality;
        let dataUrl = canvas.toDataURL(mimeType, quality);

        // Calculate approximate size from base64 string
        let byteSize = Math.round((dataUrl.length * 3) / 4);

        // If still larger than single media limit, perform a second compression pass
        if (byteSize > MAX_SINGLE_MEDIA_BYTES && quality > 0.5) {
          quality = 0.55;
          const smallerCanvas = document.createElement('canvas');
          smallerCanvas.width = Math.round(width * 0.8);
          smallerCanvas.height = Math.round(height * 0.8);
          const sCtx = smallerCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
            dataUrl = smallerCanvas.toDataURL(mimeType, quality);
            byteSize = Math.round((dataUrl.length * 3) / 4);
            width = smallerCanvas.width;
            height = smallerCanvas.height;
          }
        }

        resolve({
          dataUrl,
          size: byteSize,
          width,
          height,
          mimeType,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validates file format and initial size before processing
 */
export function validateUploadFile(file: File): { valid: boolean; error?: string; isImage: boolean; isVideo: boolean } {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: `Unsupported format: "${file.type || file.name}". Supported formats: JPG, PNG, WebP (Photos) or MP4, WebM (Short Videos).`,
      isImage: false,
      isVideo: false,
    };
  }

  // Pre-check raw file size:
  // For images, we support files up to 15MB which will be compressed client-side
  if (isImage && file.size > 15 * 1024 * 1024) {
    return {
      valid: false,
      error: `Image is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select an image under 15 MB.`,
      isImage: true,
      isVideo: false,
    };
  }

  // For videos: Cannot be compressed via canvas, so raw size must be under 700 KB
  if (isVideo && file.size > MAX_SINGLE_MEDIA_BYTES) {
    return {
      valid: false,
      error: `Video clip is too large (${(file.size / 1024).toFixed(0)} KB). Due to Firestore document constraints (1 MB total), video clips must be under 650 KB.`,
      isImage: false,
      isVideo: true,
    };
  }

  return { valid: true, isImage, isVideo };
}

/**
 * Formats bytes to human-readable string (KB, MB)
 */
export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
