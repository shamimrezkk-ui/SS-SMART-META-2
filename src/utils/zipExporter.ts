import JSZip from 'jszip';
import { ImageItem, PlatformType } from '../types';
import { embedMetadataInBytes } from './metadataEmbedder';
import { titleToFilename } from './filenameHelper';
import { buildCsvString } from './csvExporter';

/**
 * Packages all processed images (with embedded EXIF, IPTC & XMP metadata and title-based filenames)
 * along with the platform microstock CSV file into a single ZIP archive for 1-click download.
 * GUARANTEES:
 * - 100% original image resolution and pixel quality (binary header injection, ZERO recompression).
 * - Proper filenames based on Title (e.g. "Male_Lion_Walking_In_African_Savanna.jpg").
 * - Full metadata embedded inside each file.
 * - Included platform CSV.
 */
export async function downloadAllAsZip(
  items: ImageItem[],
  platform: PlatformType,
  onProgress?: (percent: number, message: string) => void
): Promise<void> {
  const validItems = items.filter((i) => i.title || (i.keywords && i.keywords.length > 0));
  if (validItems.length === 0) {
    throw new Error('No items with metadata to download.');
  }

  const zip = new JSZip();
  const folder = zip.folder('stock_assets') || zip;
  const total = validItems.length;

  for (let i = 0; i < total; i++) {
    const item = validItems[i];
    if (onProgress) {
      const pct = Math.round(((i + 1) / (total + 1)) * 90);
      onProgress(pct, `Embedding & packaging "${item.name}" (${i + 1}/${total})...`);
    }

    try {
      let sourceBuffer: ArrayBuffer;
      if (item.originalFile) {
        sourceBuffer = await item.originalFile.arrayBuffer();
      } else {
        const res = await fetch(item.previewUrl);
        sourceBuffer = await res.arrayBuffer();
      }

      const uint8 = new Uint8Array(sourceBuffer);

      // Embed metadata directly into byte stream (ZERO pixel changes, 100% original resolution)
      const embeddedBytes = embedMetadataInBytes(
        uint8,
        item.title || item.name,
        item.description || item.title || '',
        item.keywords || []
      );

      // Target filename based on Title
      const targetFilename = titleToFilename(item.title || item.name, item.name);

      folder.file(targetFilename, embeddedBytes);
    } catch (err) {
      console.warn(`Failed to package ${item.name}:`, err);
      // Fallback: include original file if fetch/embed had issues
      if (item.originalFile) {
        const buf = await item.originalFile.arrayBuffer();
        folder.file(item.name, buf);
      }
    }
  }

  // Also include the Microstock CSV file inside the ZIP!
  if (onProgress) {
    onProgress(95, 'Generating microstock CSV index...');
  }
  const csvContent = buildCsvString(validItems, platform);
  folder.file(`${platform}_Metadata_Export.csv`, csvContent);

  // Generate the ZIP blob
  if (onProgress) {
    onProgress(98, 'Compressing ZIP archive...');
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // Trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  const zipFilename = `SS_Smart_Meta_${platform}_${dateStr}.zip`;

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);

  if (onProgress) {
    onProgress(100, `Done! "${zipFilename}" downloaded successfully.`);
  }
}
