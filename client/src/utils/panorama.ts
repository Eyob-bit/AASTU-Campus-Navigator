/**
 * Formats and centralizes the creation of absolute panorama image URLs.
 * Prepends a leading slash if not already present, ensuring consistent path resolution on the client.
 */
export function getPanoramaImageUrl(imagePath?: string | null): string | null {
  if (!imagePath) return null;
  return imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
}
