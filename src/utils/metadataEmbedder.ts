import piexif from 'piexifjs';
import { ImageItem } from '../types';
import { titleToFilename } from './filenameHelper';

/**
 * Encodes string to UTF-8 Uint8Array
 */
function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Converts string to UTF-16LE byte array for Windows XP tags (XPTitle, XPKeywords, XPComment, XPSubject)
 * Terminated with [0x00, 0x00]
 */
function toUtf16LeBytes(str: string): number[] {
  const bytes: number[] = [];
  const s = str || '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    bytes.push(code & 0xff);
    bytes.push((code >> 8) & 0xff);
  }
  bytes.push(0, 0); // null termination
  return bytes;
}

/**
 * Creates IPTC IIM data block with Title, Description, and Keywords
 * Tag 2:05 = ObjectName / Title
 * Tag 2:25 = Keywords (repeated for each keyword)
 * Tag 2:120 = Caption / Abstract / Description
 */
function buildIptcData(title: string, description: string, keywords: string[]): Uint8Array {
  const parts: number[] = [];

  const addTag = (record: number, tagNum: number, value: string) => {
    const bytes = encodeUtf8(value.trim());
    if (bytes.length === 0) return;
    // Tag header: 0x1C (Tag marker), Record number, Tag number, 2 bytes length (big-endian)
    parts.push(0x1c);
    parts.push(record);
    parts.push(tagNum);
    parts.push((bytes.length >> 8) & 0xff);
    parts.push(bytes.length & 0xff);
    for (let i = 0; i < bytes.length; i++) {
      parts.push(bytes[i]);
    }
  };

  // Add 1:90 Character set UTF-8 tag: 0x1B, 0x25, 0x47 (\x1b%G)
  parts.push(0x1c, 0x01, 0x5a, 0x00, 0x03, 0x1b, 0x25, 0x47);

  // Add Title (2:05)
  if (title) {
    addTag(2, 5, title.slice(0, 64));
  }

  // Add Keywords (2:25 - repeated)
  for (const kw of keywords) {
    if (kw && kw.trim()) {
      addTag(2, 25, kw.trim().slice(0, 64));
    }
  }

  // Add Caption / Description (2:120)
  if (description) {
    addTag(2, 120, description.slice(0, 2000));
  }

  return new Uint8Array(parts);
}

/**
 * Builds Photoshop 3.0 APP13 segment (0xFF 0xED) containing 8BIM IPTC record
 */
function buildApp13Segment(title: string, description: string, keywords: string[]): Uint8Array {
  const iptcBytes = buildIptcData(title, description, keywords);
  const psHeader = encodeUtf8('Photoshop 3.0\x008BIM\x04\x04\x00\x00');
  const iptcLen = iptcBytes.length;

  // Photoshop requires 8BIM resource to have even length padding
  const padByte = iptcLen % 2 !== 0 ? new Uint8Array([0x00]) : new Uint8Array(0);

  const lenHeader = new Uint8Array(4);
  lenHeader[0] = (iptcLen >> 24) & 0xff;
  lenHeader[1] = (iptcLen >> 16) & 0xff;
  lenHeader[2] = (iptcLen >> 8) & 0xff;
  lenHeader[3] = iptcLen & 0xff;

  const payloadTotal = psHeader.length + 4 + iptcLen + padByte.length;
  const segLen = payloadTotal + 2;

  const seg = new Uint8Array(2 + payloadTotal);
  seg[0] = 0xff;
  seg[1] = 0xed; // APP13 marker
  seg[2] = (segLen >> 8) & 0xff;
  seg[3] = segLen & 0xff;

  let offset = 4;
  seg.set(psHeader, offset);
  offset += psHeader.length;
  seg.set(lenHeader, offset);
  offset += 4;
  seg.set(iptcBytes, offset);
  offset += iptcLen;
  if (padByte.length > 0) {
    seg.set(padByte, offset);
  }

  return seg;
}

/**
 * Builds Adobe XMP APP1 segment (0xFF 0xE1) containing Dublin Core dc:title, dc:description, dc:subject
 */
function buildXmpApp1Segment(title: string, description: string, keywords: string[]): Uint8Array {
  const cleanTitle = (title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cleanDesc = (description || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kwList = keywords
    .map((k) => `<rdf:li>${k.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</rdf:li>`)
    .join('');

  const xmp = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="SS SMART META 2">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">
   <dc:title>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">${cleanTitle}</rdf:li>
    </rdf:Alt>
   </dc:title>
   <dc:description>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">${cleanDesc}</rdf:li>
    </rdf:Alt>
   </dc:description>
   <dc:subject>
    <rdf:Bag>
     ${kwList}
    </rdf:Bag>
   </dc:subject>
   <photoshop:Headline>${cleanTitle}</photoshop:Headline>
   <photoshop:CaptionWriter>SS SMART META 2</photoshop:CaptionWriter>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

  const xmpBytes = encodeUtf8(xmp);
  const xmpIdentifier = encodeUtf8('http://ns.adobe.com/xap/1.0/\x00');
  const payloadTotal = xmpIdentifier.length + xmpBytes.length;
  const segLen = payloadTotal + 2;

  const seg = new Uint8Array(2 + payloadTotal);
  seg[0] = 0xff;
  seg[1] = 0xe1; // APP1 marker
  seg[2] = (segLen >> 8) & 0xff;
  seg[3] = segLen & 0xff;
  seg.set(xmpIdentifier, 4);
  seg.set(xmpBytes, 4 + xmpIdentifier.length);

  return seg;
}

/**
 * Builds EXIF APP1 segment (0xFF 0xE1) with standard IFD0 and Windows XP tags
 * This ensures Windows Explorer Properties -> Details tab shows Title, Subject, Tags, Comments!
 */
function buildExifApp1Segment(title: string, description: string, keywords: string[]): Uint8Array {
  const kwString = keywords.join('; ');
  const exifObj = {
    '0th': {
      [piexif.ImageIFD.ImageDescription]: title || description || 'Commercial Stock Asset',
      [piexif.ImageIFD.Software]: 'SS SMART META 2 Contributor Pro',
      [piexif.ImageIFD.Artist]: 'Shamim Reza',
      [piexif.ImageIFD.XPTitle]: toUtf16LeBytes(title || ''),
      [piexif.ImageIFD.XPKeywords]: toUtf16LeBytes(kwString),
      [piexif.ImageIFD.XPComment]: toUtf16LeBytes(description || ''),
      [piexif.ImageIFD.XPSubject]: toUtf16LeBytes(title || ''),
    },
    Exif: {},
    GPS: {},
  };

  const dumpedStr = piexif.dump(exifObj);
  const dumpedBytes = new Uint8Array(dumpedStr.length);
  for (let i = 0; i < dumpedStr.length; i++) {
    dumpedBytes[i] = dumpedStr.charCodeAt(i) & 0xff;
  }

  const segLen = dumpedBytes.length + 2;
  const seg = new Uint8Array(2 + dumpedBytes.length);
  seg[0] = 0xff;
  seg[1] = 0xe1; // APP1 marker
  seg[2] = (segLen >> 8) & 0xff;
  seg[3] = segLen & 0xff;
  seg.set(dumpedBytes, 4);

  return seg;
}

/**
 * Embeds EXIF (Windows XP tags), IPTC IIM (8BIM), and XMP metadata into a JPEG buffer
 * Guaranteed to be visible in Windows Explorer Details, Adobe Photoshop, Bridge, Lightroom, and Stock Portals!
 */
export function embedMetadataInJpeg(
  jpegBytes: Uint8Array,
  title: string,
  description: string,
  keywords: string[]
): Uint8Array {
  // Validate SOI marker 0xFF 0xD8
  if (jpegBytes.length < 4 || jpegBytes[0] !== 0xff || jpegBytes[1] !== 0xd8) {
    return jpegBytes;
  }

  const exifSeg = buildExifApp1Segment(title, description, keywords);
  const xmpSeg = buildXmpApp1Segment(title, description, keywords);
  const iptcSeg = buildApp13Segment(title, description, keywords);

  // Split existing JPEG segments cleanly
  let app0Segment: Uint8Array | null = null;
  const otherSegments: Uint8Array[] = [];
  let pos = 2;

  while (pos < jpegBytes.length) {
    if (jpegBytes[pos] === 0xff) {
      const marker = jpegBytes[pos + 1];

      // EOI (End of image)
      if (marker === 0xd9) {
        otherSegments.push(jpegBytes.subarray(pos));
        break;
      }

      // SOS (Start of scan - scan data follows until EOI)
      if (marker === 0xda) {
        otherSegments.push(jpegBytes.subarray(pos));
        break;
      }

      // Restart or null markers
      if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) {
        pos += 2;
        continue;
      }

      if (pos + 3 >= jpegBytes.length) break;

      const segLen = (jpegBytes[pos + 2] << 8) | jpegBytes[pos + 3];
      const segTotal = 2 + segLen;
      if (pos + segTotal > jpegBytes.length) break;

      const fullSeg = jpegBytes.subarray(pos, pos + segTotal);

      if (marker === 0xe0) {
        // Keep JFIF APP0 so JPEG spec order is maintained
        app0Segment = fullSeg;
      } else if (marker === 0xe1) {
        // Omit existing EXIF/XMP to prevent duplicate or conflicting metadata
      } else if (marker === 0xed) {
        // Omit existing APP13 (Photoshop IPTC)
      } else {
        otherSegments.push(fullSeg);
      }

      pos += segTotal;
    } else {
      pos++;
    }
  }

  // Calculate total byte size
  let totalLength = 2; // SOI
  if (app0Segment) totalLength += app0Segment.length;
  totalLength += exifSeg.length;
  totalLength += xmpSeg.length;
  totalLength += iptcSeg.length;
  for (const seg of otherSegments) {
    totalLength += seg.length;
  }

  // Construct combined JPEG
  const result = new Uint8Array(totalLength);
  result[0] = 0xff;
  result[1] = 0xd8; // SOI
  let currentOffset = 2;

  if (app0Segment) {
    result.set(app0Segment, currentOffset);
    currentOffset += app0Segment.length;
  }

  result.set(exifSeg, currentOffset);
  currentOffset += exifSeg.length;

  result.set(xmpSeg, currentOffset);
  currentOffset += xmpSeg.length;

  result.set(iptcSeg, currentOffset);
  currentOffset += iptcSeg.length;

  for (const seg of otherSegments) {
    result.set(seg, currentOffset);
    currentOffset += seg.length;
  }

  return result;
}

/**
 * Standard CRC32 table for PNG chunks
 */
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Builds a PNG tEXt chunk
 */
function buildPngTextChunk(keyword: string, text: string): Uint8Array {
  const kwBytes = encodeUtf8(keyword);
  const textBytes = encodeUtf8(text);
  const dataLen = kwBytes.length + 1 + textBytes.length;

  const chunkData = new Uint8Array(4 + dataLen);
  // Chunk type 'tEXt'
  chunkData[0] = 0x74;
  chunkData[1] = 0x45;
  chunkData[2] = 0x58;
  chunkData[3] = 0x74;

  chunkData.set(kwBytes, 4);
  chunkData[4 + kwBytes.length] = 0x00; // null separator
  chunkData.set(textBytes, 4 + kwBytes.length + 1);

  const crc = calculateCrc32(chunkData);

  const totalChunk = new Uint8Array(4 + chunkData.length + 4);
  // Length (4 bytes)
  totalChunk[0] = (dataLen >> 24) & 0xff;
  totalChunk[1] = (dataLen >> 16) & 0xff;
  totalChunk[2] = (dataLen >> 8) & 0xff;
  totalChunk[3] = dataLen & 0xff;
  // Type + data
  totalChunk.set(chunkData, 4);
  // CRC (4 bytes)
  const crcOffset = 4 + chunkData.length;
  totalChunk[crcOffset] = (crc >> 24) & 0xff;
  totalChunk[crcOffset + 1] = (crc >> 16) & 0xff;
  totalChunk[crcOffset + 2] = (crc >> 8) & 0xff;
  totalChunk[crcOffset + 3] = crc & 0xff;

  return totalChunk;
}

/**
 * Embeds metadata into PNG image via tEXt chunks (Title, Description, Keywords, Software)
 */
export function embedMetadataInPng(
  pngBytes: Uint8Array,
  title: string,
  description: string,
  keywords: string[]
): Uint8Array {
  // Check PNG signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    pngBytes.length < 8 ||
    pngBytes[0] !== 0x89 ||
    pngBytes[1] !== 0x50 ||
    pngBytes[2] !== 0x4e ||
    pngBytes[3] !== 0x47
  ) {
    return pngBytes;
  }

  // Find IHDR chunk (typically right after 8-byte signature: 4 bytes length, 4 bytes 'IHDR', 13 bytes data, 4 bytes crc = 25 bytes + 8 = 33)
  const ihdrEnd = 8 + 4 + 4 + 13 + 4;
  if (pngBytes.length < ihdrEnd) return pngBytes;

  const chunks: Uint8Array[] = [
    buildPngTextChunk('Title', title),
    buildPngTextChunk('Description', description),
    buildPngTextChunk('Comment', description),
    buildPngTextChunk('Keywords', keywords.join(', ')),
    buildPngTextChunk('Software', 'SS SMART META 2'),
    buildPngTextChunk('Author', 'Shamim Reza'),
  ];

  let addedLength = 0;
  for (const c of chunks) addedLength += c.length;

  const result = new Uint8Array(pngBytes.length + addedLength);
  result.set(pngBytes.subarray(0, ihdrEnd), 0);

  let offset = ihdrEnd;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }

  result.set(pngBytes.subarray(ihdrEnd), offset);
  return result;
}

/**
 * Master metadata embedder: Handles both JPEG and PNG formats cleanly
 */
export function embedMetadataInBytes(
  bytes: Uint8Array,
  title: string,
  description: string,
  keywords: string[]
): Uint8Array {
  if (bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return embedMetadataInJpeg(bytes, title, description, keywords);
  }
  if (bytes.length > 4 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    return embedMetadataInPng(bytes, title, description, keywords);
  }
  return bytes;
}

/**
 * Embeds metadata directly into original file in-place if FileSystemFileHandle is available
 * NO BROWSER DOWNLOADS TRIGGERED!
 */
export async function embedDirectlyIntoItem(
  item: ImageItem
): Promise<{ success: boolean; message: string; updatedName?: string }> {
  try {
    let sourceBuffer: ArrayBuffer;
    if (item.originalFile) {
      sourceBuffer = await item.originalFile.arrayBuffer();
    } else if (item.previewUrl.startsWith('data:')) {
      const res = await fetch(item.previewUrl);
      sourceBuffer = await res.arrayBuffer();
    } else {
      const res = await fetch(item.previewUrl);
      sourceBuffer = await res.arrayBuffer();
    }

    const uint8 = new Uint8Array(sourceBuffer);
    const updatedBytes = embedMetadataInBytes(
      uint8,
      item.title || item.name,
      item.description || item.title || '',
      item.keywords || []
    );

    const targetName = titleToFilename(item.title, item.name);
    const blob = new Blob([updatedBytes.buffer as ArrayBuffer], {
      type: item.format === 'PNG' ? 'image/png' : 'image/jpeg',
    });

    // If FileSystemFileHandle is present, write directly in-place without duplicate
    if (item.fileHandle && typeof item.fileHandle.createWritable === 'function') {
      const writable = await item.fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return {
        success: true,
        message: `Updated "${targetName}" directly in-place without download!`,
        updatedName: targetName,
      };
    }

    return {
      success: true,
      message: `Metadata ready for "${targetName}".`,
      updatedName: targetName,
    };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Failed to embed' };
  }
}
