declare module 'piexifjs' {
  const piexif: {
    ImageIFD: Record<string, number>;
    ExifIFD: Record<string, number>;
    GPSIFD: Record<string, number>;
    InteropIFD: Record<string, number>;
    dump: (exifObj: any) => string;
    load: (data: string) => any;
    insert: (exif: string, jpeg: string) => string;
    remove: (jpeg: string) => string;
    TAGS: any;
  };
  export default piexif;
}
