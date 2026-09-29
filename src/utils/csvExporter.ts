import { ImageItem, PlatformType } from '../types';

function escapeCsvField(val: string | number | undefined): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  // If field contains comma, quote, or newline, escape double quotes and wrap in quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function generateCsvHeaders(platform: PlatformType): string[] {
  switch (platform) {
    case 'AdobeStock':
      return ['Filename', 'Title', 'Keywords', 'Category'];
    case 'Shutterstock':
      return ['Filename', 'Description', 'Keywords', 'Categories'];
    case 'Freepik':
      return ['Filename', 'Title', 'Keywords'];
    case 'Vecteezy':
      return ['Filename', 'Title', 'Description', 'Keywords'];
    case 'Depositphotos':
      return ['Filename', 'Description', 'Keywords'];
    case '123RF':
      return ['Filename', 'Title', 'Keywords'];
    case 'Dreamstime':
      return ['Filename', 'Title', 'Description', 'Keywords'];
    case 'iStock':
      return ['Filename', 'Title', 'Description', 'Keywords'];
    case 'Magnific':
      return ['Filename', 'Prompt', 'Title', 'Keywords'];
    case 'General':
    default:
      return ['Filename', 'Title', 'Description', 'Keywords'];
  }
}

export function generateCsvRow(item: ImageItem, platform: PlatformType): string[] {
  const keywordsJoined = (item.keywords || []).join(', ');
  const cat = item.category || 'General';

  switch (platform) {
    case 'AdobeStock':
      return [item.name, item.title || '', keywordsJoined, cat];
    case 'Shutterstock':
      return [item.name, item.description || item.title || '', keywordsJoined, cat];
    case 'Freepik':
      return [item.name, item.title || '', keywordsJoined];
    case 'Vecteezy':
      return [item.name, item.title || '', item.description || '', keywordsJoined];
    case 'Depositphotos':
      return [item.name, item.description || item.title || '', keywordsJoined];
    case '123RF':
      return [item.name, item.title || '', keywordsJoined];
    case 'Dreamstime':
      return [item.name, item.title || '', item.description || '', keywordsJoined];
    case 'iStock':
      return [item.name, item.title || '', item.description || '', keywordsJoined];
    case 'Magnific':
      return [item.name, item.description || item.title || '', item.title || '', keywordsJoined];
    case 'General':
    default:
      return [item.name, item.title || '', item.description || '', keywordsJoined];
  }
}

export function buildCsvString(items: ImageItem[], platform: PlatformType): string {
  const headers = generateCsvHeaders(platform);
  const rows = items.map((item) => generateCsvRow(item, platform).map(escapeCsvField).join(','));
  return [headers.join(','), ...rows].join('\r\n');
}

export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
