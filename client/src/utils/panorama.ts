/**
 * Formats and centralizes the creation of panorama image URLs.
 * Returns full URLs (Cloudinary) as-is, and prepends a leading slash for relative paths.
 */
export function getPanoramaImageUrl(imagePath?: string | null): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
}
