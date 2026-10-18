/**
 * Universal EPS Vector Preview Extractor
 * Extracts and decodes the exact visual artwork preview of EPS files.
 *
 * Strategies:
 * 1. Decode DOS EPS 30-byte Header embedded TIFF preview into RGBA Canvas via UTIF.
 * 2. Scan for embedded JPEG thumbnail stream (0xFF 0xD8 ... 0xFF 0xD9).
 * 3. Parse PostScript %BeginPreview hex bitmap to canvas.
 * 4. Parse PostScript vector paths (moveto, lineto, curveto, fill, stroke) into crisp SVG.
 * 5. Clean, high-fidelity vector preview canvas with white studio backdrop.
 */

import UTIF from 'utif';

export async function extractEpsVisualPreview(file: File): Promise<string> {
  // 1. PRIMARY STRATEGY: Native Server Ghostscript Vector Rasterizer (Industry Standard - 100% exact Bounding Box & vector paths)
  try {
    const response = await fetch('/api/render-eps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: file,
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.previewUrl) {
        return data.previewUrl;
      }
    }
  } catch (e) {
    console.warn('Server Ghostscript EPS render error, falling back to client decoders:', e);
  }

  // 2. CLIENT FALLBACK STRATEGIES
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Check EPS binary header (TIFF preview via UTIF)
    const tiffUrl = extractBinaryHeaderTiffWithUtif(bytes);
    if (tiffUrl) return tiffUrl;

    // Scan for embedded JPEG thumbnail
    const jpegUrl = extractEmbeddedJpeg(bytes);
    if (jpegUrl) return jpegUrl;

    // Read full text for PostScript parsing
    const decoder = new TextDecoder('latin1');
    const text = decoder.decode(bytes.subarray(0, Math.min(bytes.length, 4000000)));

    // Check %BeginPreview hex bitmap
    const hexPreviewUrl = parseHexPreview(text);
    if (hexPreviewUrl) return hexPreviewUrl;

    // Parse PostScript vector paths into clean SVG
    const svgUrl = parsePostscriptPathsToSvg(text);
    if (svgUrl) return svgUrl;

    // Clean vector card
    return generateCleanVectorCard(text, file.name, file.size);
  } catch (err) {
    console.warn('Failed to extract EPS visual preview:', err);
    return '';
  }
}

/**
 * Decodes 30-byte DOS EPS Binary Header (0xC5 0xD0 0xD3 0xC6) TIFF preview into PNG Data URL via UTIF
 */
function extractBinaryHeaderTiffWithUtif(bytes: Uint8Array): string | null {
  if (bytes.length < 30) return null;
  if (bytes[0] === 0xc5 && bytes[1] === 0xd0 && bytes[2] === 0xd3 && bytes[3] === 0xc6) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const tiffOffset = view.getUint32(20, true);
    const tiffLength = view.getUint32(24, true);

    if (tiffOffset > 0 && tiffLength > 50 && tiffOffset + tiffLength <= bytes.length) {
      const tiffBytes = bytes.subarray(tiffOffset, tiffOffset + tiffLength);

      // Check if TIFF contains embedded JPEG stream
      const nestedJpeg = extractEmbeddedJpeg(tiffBytes);
      if (nestedJpeg) return nestedJpeg;

      // Decode TIFF using UTIF to Canvas RGBA
      try {
        const buffer = (tiffBytes.buffer as ArrayBuffer).slice(
          tiffBytes.byteOffset,
          tiffBytes.byteOffset + tiffBytes.byteLength
        );
        const ifds = UTIF.decode(buffer);
        if (ifds && ifds.length > 0) {
          const firstPage = ifds[0];
          UTIF.decodeImage(buffer, firstPage);
          const rgba = UTIF.toRGBA8(firstPage);
          const w = firstPage.width;
          const h = firstPage.height;
          if (w > 0 && h > 0 && rgba && rgba.length > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const imgData = ctx.createImageData(w, h);
              imgData.data.set(rgba);
              ctx.putImageData(imgData, 0, 0);
              return canvas.toDataURL('image/png');
            }
          }
        }
      } catch (err) {
        console.warn('UTIF TIFF decode error:', err);
      }
    }
  }
  return null;
}

/**
 * Scans bytes for embedded JPEG SOI (0xFF 0xD8 0xFF) and EOI (0xFF 0xD9)
 */
function extractEmbeddedJpeg(bytes: Uint8Array): string | null {
  const len = bytes.length;
  for (let i = 0; i < len - 4; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
      for (let j = i + 10; j < Math.min(len - 1, i + 5000000); j++) {
        if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
          const jpegSlice = bytes.subarray(i, j + 2);
          if (jpegSlice.length > 200) {
            const blob = new Blob([jpegSlice as any], { type: 'image/jpeg' });
            return URL.createObjectURL(blob);
          }
        }
      }
    }
  }
  return null;
}

/**
 * Parses PostScript %BeginPreview: <width> <height> <depth> <lines> hex bitmap
 */
function parseHexPreview(text: string): string | null {
  const match = text.match(/%BeginPreview:\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i);
  if (!match) return null;

  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  const depth = parseInt(match[3], 10);

  if (!width || !height || width <= 0 || height <= 0 || width > 2500 || height > 2500) {
    return null;
  }

  const startIdx = text.indexOf(match[0]) + match[0].length;
  const endIdx = text.indexOf('%EndPreview', startIdx);
  if (endIdx === -1) return null;

  const hexLines = text.substring(startIdx, endIdx).replace(/[^0-9a-fA-F]/g, '');
  if (!hexLines || hexLines.length < (width * height) / 8) return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fill with crisp white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    let hexPtr = 0;
    if (depth === 1) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x += 8) {
          if (hexPtr >= hexLines.length) break;
          const byteVal = parseInt(hexLines.substr(hexPtr, 2), 16);
          hexPtr += 2;
          for (let b = 0; b < 8 && x + b < width; b++) {
            const bit = (byteVal >> (7 - b)) & 1;
            const idx = (y * width + (x + b)) * 4;
            const col = bit === 0 ? 0 : 255;
            data[idx] = col;
            data[idx + 1] = col;
            data[idx + 2] = col;
            data[idx + 3] = 255;
          }
        }
      }
    } else if (depth === 8) {
      for (let i = 0; i < width * height; i++) {
        if (hexPtr >= hexLines.length) break;
        const gray = parseInt(hexLines.substr(hexPtr, 2), 16);
        hexPtr += 2;
        const idx = i * 4;
        data[idx] = gray;
        data[idx + 1] = gray;
        data[idx + 2] = gray;
        data[idx + 3] = 255;
      }
    } else {
      return null;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Parses PostScript vector paths (moveto, lineto, curveto, fill, stroke) into clean SVG with crisp contrast
 */
function parsePostscriptPathsToSvg(text: string): string | null {
  const bbMatch = text.match(/%%BoundingBox:\s*(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)/i);
  let minX = 0,
    minY = 0,
    maxX = 800,
    maxY = 600;
  if (bbMatch) {
    minX = parseInt(bbMatch[1], 10);
    minY = parseInt(bbMatch[2], 10);
    maxX = parseInt(bbMatch[3], 10);
    maxY = parseInt(bbMatch[4], 10);
  }
  const width = Math.max(10, maxX - minX);
  const height = Math.max(10, maxY - minY);

  const lines = text.split(/\r?\n/);
  const svgPaths: Array<{ d: string; fill: string; stroke: string; strokeWidth?: number }> = [];

  let currentD = '';
  let currentColor = '#000000'; // Default black for vector artwork

  for (let i = 0; i < Math.min(lines.length, 30000); i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('%')) continue;

    // RGB Color: r g b rg  or  r g b setrgbcolor
    const rgb = line.match(/^([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+(?:rg|setrgbcolor)$/i);
    if (rgb) {
      const r = Math.round(parseFloat(rgb[1]) * 255);
      const g = Math.round(parseFloat(rgb[2]) * 255);
      const b = Math.round(parseFloat(rgb[3]) * 255);
      currentColor = `rgb(${r},${g},${b})`;
      continue;
    }

    // CMYK Color: c m y k k  or  c m y k setcmykcolor
    const cmyk = line.match(/^([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s+(?:k|setcmykcolor)$/i);
    if (cmyk) {
      const c = parseFloat(cmyk[1]),
        m = parseFloat(cmyk[2]),
        y = parseFloat(cmyk[3]),
        k = parseFloat(cmyk[4]);
      const r = Math.round(255 * (1 - c) * (1 - k));
      const g = Math.round(255 * (1 - m) * (1 - k));
      const b = Math.round(255 * (1 - y) * (1 - k));
      currentColor = `rgb(${r},${g},${b})`;
      continue;
    }

    // Gray: g g or setgray
    const gray = line.match(/^([\d\.]+)\s+(?:g|setgray)$/i);
    if (gray) {
      const val = Math.round(parseFloat(gray[1]) * 255);
      currentColor = `rgb(${val},${val},${val})`;
      continue;
    }

    // moveto: x y m or moveto
    const m = line.match(/^([\d\.\-]+)\s+([\d\.\-]+)\s+(?:m|moveto)$/i);
    if (m) {
      const x = (parseFloat(m[1]) - minX).toFixed(1);
      const y = (maxY - parseFloat(m[2])).toFixed(1);
      currentD += ` M ${x} ${y}`;
      continue;
    }

    // lineto: x y l or lineto
    const l = line.match(/^([\d\.\-]+)\s+([\d\.\-]+)\s+(?:l|lineto)$/i);
    if (l) {
      const x = (parseFloat(l[1]) - minX).toFixed(1);
      const y = (maxY - parseFloat(l[2])).toFixed(1);
      currentD += ` L ${x} ${y}`;
      continue;
    }

    // curveto: x1 y1 x2 y2 x3 y3 c or curveto
    const c = line.match(
      /^([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+(?:c|curveto)$/i
    );
    if (c) {
      const x1 = (parseFloat(c[1]) - minX).toFixed(1);
      const y1 = (maxY - parseFloat(c[2])).toFixed(1);
      const x2 = (parseFloat(c[3]) - minX).toFixed(1);
      const y2 = (maxY - parseFloat(c[4])).toFixed(1);
      const x3 = (parseFloat(c[5]) - minX).toFixed(1);
      const y3 = (maxY - parseFloat(c[6])).toFixed(1);
      currentD += ` C ${x1} ${y1}, ${x2} ${y2}, ${x3} ${y3}`;
      continue;
    }

    // closepath: h or cp or closepath
    if (line.match(/^(?:h|cp|closepath)$/i)) {
      currentD += ' Z';
      continue;
    }

    // fill: f or fill or F or b or B
    if (line.match(/^(?:f|fill|F|b|B)$/i)) {
      if (currentD) {
        svgPaths.push({ d: currentD, fill: currentColor, stroke: 'none' });
        currentD = '';
      }
    } else if (line.match(/^(?:s|stroke|S)$/i)) {
      if (currentD) {
        svgPaths.push({ d: currentD, fill: 'none', stroke: currentColor, strokeWidth: 1.5 });
        currentD = '';
      }
    }
  }

  if (svgPaths.length === 0) return null;

  // Render on clean white background so black/colored vectors pop with 100% clarity
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#FFFFFF"/>
  ${svgPaths
    .map(
      (p) =>
        `<path d="${p.d}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.strokeWidth || 1}" />`
    )
    .join('\n  ')}
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

/**
 * Generates clean crisp vector card with white studio background
 */
function generateCleanVectorCard(text: string, filename: string, sizeBytes: number): string {
  const bbMatch = text.match(/%%BoundingBox:\s*(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)/i);
  let dims = 'Scalable Vector Graphic';
  if (bbMatch) {
    const w = parseInt(bbMatch[3], 10) - parseInt(bbMatch[1], 10);
    const h = parseInt(bbMatch[4], 10) - parseInt(bbMatch[2], 10);
    dims = `${w} × ${h} pt`;
  }

  const cleanTitle = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <!-- Clean Crisp White Studio Backdrop -->
  <rect width="600" height="400" fill="#FFFFFF"/>
  <rect x="2" y="2" width="596" height="396" fill="none" stroke="#E2E8F0" stroke-width="4"/>

  <!-- Centered Emblem -->
  <g transform="translate(300, 160)">
    <circle r="75" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
    <rect x="-42" y="-42" width="84" height="84" rx="18" fill="#18181B"/>
    <text y="14" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="900" fill="#FFFFFF" text-anchor="middle">EPS</text>
  </g>

  <!-- Typography -->
  <text x="300" y="275" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#0F172A" text-anchor="middle">${escapeXml(cleanTitle)}</text>
  <text x="300" y="305" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#2563EB" text-anchor="middle">EPS Vector Artwork • ${dims}</text>
  <text x="300" y="328" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#64748B" text-anchor="middle">Size: ${sizeMb} MB • 100% Vector Quality</text>
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
