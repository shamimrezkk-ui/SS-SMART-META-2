/**
 * Converts a Title into a clean microstock-friendly filename
 * e.g. "Golden Lion Walking in African Savannah" -> "Golden_Lion_Walking_In_African_Savannah.jpg"
 */
export function titleToFilename(title: string, currentFilename: string): string {
  if (!title || !title.trim()) return currentFilename;

  // Extract extension from currentFilename
  let ext = 'jpg';
  if (currentFilename && currentFilename.includes('.')) {
    ext = currentFilename.split('.').pop()?.toLowerCase() || 'jpg';
  }

  // Remove punctuation and special symbols
  const cleanTitle = title
    .replace(/[,;:.!?()[\]{}"'\\/|<>@#$%^&*+=~`]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  // Take the first 6-7 meaningful words for a clean, professional stock filename
  const words = cleanTitle.split(' ').filter((w) => w.length > 0).slice(0, 7);
  const namePart = words.join('_');

  if (!namePart) return currentFilename;

  return `${namePart}.${ext}`;
}
