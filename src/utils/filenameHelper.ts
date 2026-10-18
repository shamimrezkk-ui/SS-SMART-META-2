/**
 * Converts a Title into a clean microstock-friendly filename
 * e.g. "Male Lion Walking in African Savanna, Safari Wildlife Photography" -> "Male_Lion_Walking_In_African_Savanna.jpg"
 */
export function titleToFilename(title: string, currentFilename: string): string {
  if (!title || !title.trim()) {
    // If no title, clean up the current filename
    return currentFilename || 'stock_asset.jpg';
  }

  // Extract extension from currentFilename (preserve exact format: mp4, webm, mov, eps, svg, png, jpg, etc.)
  let ext = 'jpg';
  if (currentFilename && currentFilename.includes('.')) {
    const rawExt = currentFilename.split('.').pop()?.toLowerCase();
    if (rawExt && rawExt.length >= 2 && rawExt.length <= 5) {
      ext = rawExt;
    }
  }

  // Remove punctuation and special symbols
  const cleanTitle = title
    .replace(/[,;:.!?()[\]{}"'\\/|<>@#$%^&*+=~`]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  // Take first 8-9 meaningful words for a rich, descriptive filename
  const words = cleanTitle
    .split(' ')
    .filter((w) => w.length > 0)
    .slice(0, 9)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));

  const namePart = words.join('_');

  if (!namePart || namePart.length < 2) return currentFilename || `stock_asset.${ext}`;

  return `${namePart}.${ext}`;
}
