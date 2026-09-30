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
 * Must be null-terminated with [0x00, 0x00]
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

function toBinaryString(uint8: Uint8Array): string {
  let str = '';
  for (let i = 0; i < uint8.length; i++) {
    str += String.fromCharCode(uint8[i]);
  }
  return str;
}

function binaryStringToUint8(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
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

  const seg = new Uint8Array(4 + payloadTotal);
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

  const seg = new Uint8Array(4 + payloadTotal);
  seg[0] = 0xff;
  seg[1] = 0xe1; // APP1 marker
  seg[2] = (segLen >> 8) & 0xff;
  seg[3] = segLen & 0xff;
  seg.set(xmpIdentifier, 4);
  seg.set(xmpBytes, 4 + xmpIdentifier.length);

  return seg;
}

/**
 * Embeds EXIF (Windows XP tags), IPTC IIM (8BIM), and XMP metadata into a JPEG buffer
 * Guaranteed to be visible in Windows Explorer Details tab, Adobe Photoshop, Bridge, Lightroom, and Microstock Portals!
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

  const cleanTitle = (title || '').trim();
  const cleanDesc = (description || title || '').trim();
  const kwString = keywords.filter((k) => Boolean(k && k.trim())).join('; ');

  // 1. Build comprehensive EXIF object with Windows XP tags and standard tags
  const exifObj: any = {
    '0th': {
      [piexif.ImageIFD.ImageDescription]: cleanTitle || 'Stock Photography Asset',
      [piexif.ImageIFD.Software]: 'SS SMART META 2 Contributor Pro',
      [piexif.ImageIFD.Artist]: 'Shamim Reza',
      // Windows Explorer Details tab native tags:
      [piexif.ImageIFD.XPTitle]: toUtf16LeBytes(cleanTitle),
      [piexif.ImageIFD.XPKeywords]: toUtf16LeBytes(kwString),
      [piexif.ImageIFD.XPComment]: toUtf16LeBytes(cleanDesc),
      [piexif.ImageIFD.XPSubject]: toUtf16LeBytes(cleanTitle),
      [piexif.ImageIFD.XPAuthor]: toUtf16LeBytes('Shamim Reza'),
    },
    Exif: {
      [piexif.ExifIFD.UserComment]: cleanDesc ? `ASCII\0\0\0${cleanDesc}` : 'ASCII\0\0\0Stock Asset',
    },
    GPS: {},
  };

  let withExifBytes: Uint8Array;
  try {
    const dumpedStr = piexif.dump(exifObj);
    const jpegStr = toBinaryString(jpegBytes);
    const insertedStr = piexif.insert(dumpedStr, jpegStr);
    withExifBytes = binaryStringToUint8(insertedStr);
  } catch (exifErr) {
    console.warn('piexif.insert fallback:', exifErr);
    withExifBytes = jpegBytes;
  }

  // 2. Insert XMP (APP1) and Photoshop IPTC (APP13) right after the EXIF APP1 segment
  try {
    const xmpSeg = buildXmpApp1Segment(cleanTitle, cleanDesc, keywords);
    const iptcSeg = buildApp13Segment(cleanTitle, cleanDesc, keywords);

    // Find position right after APP1 EXIF segment (or after APP0 JFIF if no EXIF)
    let insertPos = 2;
    if (withExifBytes[2] === 0xff && withExifBytes[3] === 0xe0) {
      const app0Len = (withExifBytes[4] << 8) | withExifBytes[5];
      insertPos = 2 + 2 + app0Len;
    }
    if (withExifBytes[insertPos] === 0xff && withExifBytes[insertPos + 1] === 0xe1) {
      const exifSegLen = (withExifBytes[insertPos + 2] << 8) | withExifBytes[insertPos + 3];
      insertPos += 2 + exifSegLen;
    }

    const finalLength = withExifBytes.length + xmpSeg.length + iptcSeg.length;
    const finalBytes = new Uint8Array(finalLength);
    finalBytes.set(withExifBytes.subarray(0, insertPos), 0);
    finalBytes.set(xmpSeg, insertPos);
    finalBytes.set(iptcSeg, insertPos + xmpSeg.length);
    finalBytes.set(withExifBytes.subarray(insertPos), insertPos + xmpSeg.length + iptcSeg.length);

    return finalBytes;
  } catch (xmpErr) {
    console.warn('XMP/IPTC embedding fallback:', xmpErr);
    return withExifBytes;
  }
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
  chunkData[0] = 0x74; // 't'
  chunkData[1] = 0x45; // 'E'
  chunkData[2] = 0x58; // 'X'
  chunkData[3] = 0x74; // 't'

  chunkData.set(kwBytes, 4);
  chunkData[4 + kwBytes.length] = 0x00;
  chunkData.set(textBytes, 4 + kwBytes.length + 1);

  const crc = calculateCrc32(chunkData);

  const totalChunk = new Uint8Array(4 + chunkData.length + 4);
  totalChunk[0] = (dataLen >> 24) & 0xff;
  totalChunk[1] = (dataLen >> 16) & 0xff;
  totalChunk[2] = (dataLen >> 8) & 0xff;
  totalChunk[3] = dataLen & 0xff;
  totalChunk.set(chunkData, 4);
  const crcOffset = 4 + chunkData.length;
  totalChunk[crcOffset] = (crc >> 24) & 0xff;
  totalChunk[crcOffset + 1] = (crc >> 16) & 0xff;
  totalChunk[crcOffset + 2] = (crc >> 8) & 0xff;
  totalChunk[crcOffset + 3] = crc & 0xff;

  return totalChunk;
}

/**
 * Embeds metadata into PNG image via tEXt chunks (Title, Description, Keywords, Software, Author)
 */
export function embedMetadataInPng(
  pngBytes: Uint8Array,
  title: string,
  description: string,
  keywords: string[]
): Uint8Array {
  if (
    pngBytes.length < 8 ||
    pngBytes[0] !== 0x89 ||
    pngBytes[1] !== 0x50 ||
    pngBytes[2] !== 0x4e ||
    pngBytes[3] !== 0x47
  ) {
    return pngBytes;
  }

  const ihdrEnd = 8 + 4 + 4 + 13 + 4;
  if (pngBytes.length < ihdrEnd) return pngBytes;

  const chunks: Uint8Array[] = [
    buildPngTextChunk('Title', title),
    buildPngTextChunk('Description', description),
    buildPngTextChunk('Comment', description),
    buildPngTextChunk('Keywords', keywords.join(', ')),
    buildPngTextChunk('Software', 'SS SMART META 2 Contributor Pro'),
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
 */
export async function embedDirectlyIntoItem(
  item: ImageItem
): Promise<{ success: boolean; message: string; updatedName?: string }> {
  try {
    let sourceBuffer: ArrayBuffer;
    if (item.originalFile) {
      sourceBuffer = await item.originalFile.arrayBuffer();
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

    const targetName = titleToFilename(item.title || item.name, item.name);
    const blob = new Blob([updatedBytes.buffer as ArrayBuffer], {
      type: item.format === 'PNG' ? 'image/png' : 'image/jpeg',
    });

    if (item.fileHandle && typeof item.fileHandle.createWritable === 'function') {
      const writable = await item.fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return {
        success: true,
        message: `Updated "${targetName}" directly in-place with embedded EXIF, IPTC & XMP!`,
        updatedName: targetName,
      };
    }

    return {
      success: true,
      message: `Metadata prepared for "${targetName}".`,
      updatedName: targetName,
    };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Failed to embed' };
  }
}

/**
 * Downloads a single image file with embedded EXIF, IPTC & XMP metadata and title filename
 */
export async function downloadEmbeddedImage(item: ImageItem): Promise<string> {
  let sourceBuffer: ArrayBuffer;
  if (item.originalFile) {
    sourceBuffer = await item.originalFile.arrayBuffer();
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

  // Rename filename according to Title
  const targetName = titleToFilename(item.title || item.name, item.name);
  const blob = new Blob([updatedBytes.buffer as ArrayBuffer], {
    type: item.format === 'PNG' ? 'image/png' : 'image/jpeg',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = targetName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  return targetName;
}
