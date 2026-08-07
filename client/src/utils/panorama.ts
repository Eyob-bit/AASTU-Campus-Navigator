/**
 * Formats and centralizes the creation of panorama image URLs.
 * Returns full URLs (Cloudinary) as-is, and prepends a leading slash for relative paths.
 */
export function getPanoramaImageUrl(
  imagePath?: string | null,
  options?: { maxWidth?: number }
): string | null {
  if (!imagePath) return null;

  let url = imagePath;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = url.startsWith("/") ? url : `/${url}`;
  }

  // Format Cloudinary URLs to optimize for mobile WebGL limits & fast loading
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    const maxWidth = options?.maxWidth ?? 2048;
    // Replace upload/ with upload/w_{maxWidth},c_limit,q_auto/ (avoiding double insertion if already transformed)
    if (!url.includes("/upload/w_")) {
      url = url.replace("/upload/", `/upload/w_${maxWidth},c_limit,q_auto/`);
    }
  }

  return url;
}
