/**
 * Slug Utilities
 * Generate and validate URL-friendly slugs
 */

/**
 * Generate slug from text
 * - Lowercase
 * - Remove special characters
 * - Replace spaces with hyphens
 * - Remove trailing hyphens
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending counter if needed
 * Accepts existing slugs to check against
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
  maxAttempts = 100,
): Promise<string> {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  for (let i = 1; i <= maxAttempts; i++) {
    const candidateSlug = `${baseSlug}-${i}`;
    if (!existingSlugs.includes(candidateSlug)) {
      return candidateSlug;
    }
  }

  throw new Error(`Unable to generate unique slug for base: ${baseSlug}`);
}

/**
 * Extract ID from slugAndId format
 * Format: "slug-65f1a2b3c4d5e6f7g8h9i0j1"
 * Returns: "65f1a2b3c4d5e6f7g8h9i0j1" (last 24 chars if valid MongoDB ObjectId)
 */
export function extractIdFromSlugAndId(slugAndId: string): string | null {
  if (!slugAndId) return null;

  // MongoDB ObjectId is 24 hex characters
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
 * Extract slug from slugAndId format
 * Format: "slug-65f1a2b3c4d5e6f7g8h9i0j1"
 * Returns: "slug"
 */
export function extractSlugFromSlugAndId(slugAndId: string): string | null {
  const id = extractIdFromSlugAndId(slugAndId);
  if (!id) return null;

  // Remove the ID and trailing hyphen
  return slugAndId.slice(0, slugAndId.lastIndexOf("-")) || null;
}

/**
 * Build slugAndId format
 * Combines slug and ID into SEO-friendly URL component
 */
export function buildSlugAndId(slug: string, id: string): string {
  return `${slug}-${id}`;
}

/**
 * Check if ID matches a slug
 * Used for validation/redirects
 */
export function isValidSlugAndId(
  slugAndId: string,
  pattern = /^[a-z0-9-]+-[a-f0-9]{24}$/i,
): boolean {
  return pattern.test(slugAndId);
}

/**
 * Remove Vietnamese tones/accents from a string
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  let result = str;
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  result = result.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  result = result.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  result = result.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  result = result.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  result = result.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  result = result.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  result = result.replace(/Đ/g, "D");
  // Combine accents if encoded separately
  result = result.replace(/\u0300|\u0301|\u0309|\u0303|\u0323/g, "");
  result = result.replace(/\u02C6|\u0306|\u031B/g, "");
  return result;
}
