import "server-only";
import sharp from "sharp";
import { DomainError } from "./errors";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_SIZE = 320;

/**
 * Decodes the upload as an image (rejecting anything that isn't one, whatever its
 * extension says), crops it square, strips metadata (e.g. GPS) and re-encodes as WebP.
 */
export async function processProfilePhoto(file: File): Promise<Buffer> {
  if (file.size > MAX_PHOTO_BYTES) throw new DomainError("Photo must be 5 MB or smaller.");
  if (!file.type.startsWith("image/")) throw new DomainError("Upload a JPG, PNG or WebP image.");
  try {
    return await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate() // respect EXIF orientation before metadata is dropped
      .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new DomainError("That file couldn't be read as an image.");
  }
}
