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

  // Sanitize title: remove illegal characters, trim, replace spaces with underscores
  const clean = title
    .trim()
    .replace(/[<>:"/\\|?*#%&{}\\$!'@+`=~^]/g, '') // remove illegal characters
    .replace(/\s+/g, '_')                          // spaces to underscores
    .replace(/_+/g, '_')                           // collapse duplicate underscores
    .replace(/^_+|_+$/g, '')                       // trim leading/trailing underscores
    .slice(0, 95);                                 // keep safe length

  if (!clean) return currentFilename;

  return `${clean}.${ext}`;
}
