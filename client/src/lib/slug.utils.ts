/**
 * Frontend Slug Utilities
 * Handle slug+ID conversions for URLs
 */

/**
 * Extract MongoDB ObjectId from slugAndId format
 * Format: "slug-65f1a2b3c4d5e6f7g8h9i0j1"
 * Returns: "65f1a2b3c4d5e6f7g8h9i0j1" (last 24 chars if valid)
 */
export function extractIdFromSlugAndId(slugAndId: string): string | null {
  if (!slugAndId) return null;

  const parts = slugAndId.split("-");
  if (parts.length === 0) return null;

  const lastPart = parts[parts.length - 1];

  // Check if last part is valid MongoDB ObjectId (24 hex chars)
  if (/^[a-f0-9]{24}$/i.test(lastPart)) {
    return lastPart;
  }

  return null;
}

/**
 * Build slugAndId format for URL
 * Combines slug and ID into SEO-friendly URL component
 */
export function buildSlugAndId(slug: string, id: string): string {
  return `${slug}-${id}`;
}

/**
 * Get product detail URL
 * Returns: "/plant/slug-id"
 */
export function getProductDetailUrl(product: {
  slug: string;
  _id: string;
}): string {
  return `/plant/${buildSlugAndId(product.slug, product._id)}`;
}
