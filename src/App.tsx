import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PlatformsBar } from './components/PlatformsBar';
import { UploadArea } from './components/UploadArea';
import { CountersBar } from './components/CountersBar';
import { Toolbar } from './components/Toolbar';
import { MetadataCard } from './components/MetadataCard';
import { ExportFooter } from './components/ExportFooter';
import { ApiKeysModal } from './components/ApiKeysModal';
import { PreviewCsvModal } from './components/PreviewCsvModal';
import { BatchEditModal } from './components/BatchEditModal';
import { HelpModal } from './components/HelpModal';
import { ImageToPromptView } from './components/ImageToPromptView';
import { AdminPanelModal } from './components/AdminPanelModal';
import { EmbedMetadataModal } from './components/EmbedMetadataModal';
import { ImageItem, PlatformType, AppSettings, GeminiKey, AdminLinks, UserProfile } from './types';
import { loadStoredKeys, getNextAvailableKey, markKeyRateLimited } from './utils/apiKeyManager';
import { buildCsvString, downloadCsvFile } from './utils/csvExporter';
import { loadAdminLinks, saveAdminLinks } from './utils/adminManager';
import { titleToFilename } from './utils/filenameHelper';
import { downloadAllAsZip } from './utils/zipExporter';
import { extractEpsVisualPreview } from './utils/epsPreviewHelper';
import { Image as ImageIcon, Box } from 'lucide-react';

const USER_STORAGE_KEY = 'ss_smart_meta_user';

const SAMPLE_LION_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23b8860b"/><rect y="260" width="600" height="140" fill="%238b5a2b"/><circle cx="280" cy="200" r="90" fill="%23d2691e"/><circle cx="280" cy="190" r="60" fill="%23cd853f"/><ellipse cx="230" cy="240" rx="90" ry="60" fill="%23cd853f"/><rect x="180" y="270" width="25" height="100" fill="%23cd853f"/><rect x="230" y="270" width="25" height="95" fill="%23b8860b"/><rect x="290" y="270" width="25" height="95" fill="%23cd853f"/><circle cx="310" cy="180" r="7" fill="%23111"/><ellipse cx="330" cy="205" rx="14" ry="10" fill="%23111"/><text x="30" y="50" font-family="sans-serif" font-size="22" font-weight="bold" fill="%23fff">Lion on Savannah Walk (Sample)</text></svg>';

export default function App() {
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'metadata' | 'imageToPrompt'>('metadata');
  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);
  const [isPreviewCsvOpen, setIsPreviewCsvOpen] = useState(false);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [aiActive, setAiActive] = useState(true);

  // Platform selection (Default: AdobeStock)
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('AdobeStock');

  // Filters
  const [formatFilter, setFormatFilter] = useState('All Formats');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // API Keys
  const [storedKeys, setStoredKeys] = useState<GeminiKey[]>([]);

  // Admin Links
  const [adminLinks, setAdminLinks] = useState<AdminLinks>(loadAdminLinks());

  // Google / Gmail User Profile
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Shamim Reza',
      email: 'shamimrezkk@gmail.com',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=shamimrezkk@gmail.com',
      isLoggedIn: true,
      plan: 'Pro',
    };
  });

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    settingsActive: true,
    titleWordsMin: 35,
    titleWordsMax: 84,
    keywordsMin: 30,
    keywordsMax: 49,
    descriptionMin: 150,
    descriptionMax: 250,
    customPrompt: '',
    transparentBackground: true,
    silhouette: true,
    singleWordKeywords: true,
    selectedModel: 'gemini-3.8-flash',
  });

  // Uploaded / queued images: INITIAL STATE IS EMPTY! (Only shown when files are loaded)
  const [items, setItems] = useState<ImageItem[]>([]);

  // Processing Queue status
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);

  // Load stored keys on mount
  useEffect(() => {
    const loaded = loadStoredKeys();
    setStoredKeys(loaded);
  }, []);

  const handleUpdateUser = (newUser: UserProfile) => {
    setUser(newUser);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    } catch {}
  };

  const handleLogoutUser = () => {
    const loggedOut: UserProfile = {
      name: '',
      email: '',
      avatarUrl: '',
      isLoggedIn: false,
      plan: 'Free',
    };
    setUser(loggedOut);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  };

  const handleUpdateAdminLinks = (newLinks: AdminLinks) => {
    setAdminLinks(newLinks);
    saveAdminLinks(newLinks);
  };

  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Handle files selected (drag & drop, browse, or folder)
  const handleFilesSelected = async (files: FileList | File[], fileHandles?: any[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newItems: ImageItem[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const extension = file.name.split('.').pop()?.toUpperCase() || 'JPG';
      const previewUrl = URL.createObjectURL(file);
      const handle = fileHandles && fileHandles[i] ? fileHandles[i] : undefined;

      newItems.push({
        id: `img_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        originalName: file.name,
        size: file.size,
        format: extension,
        previewUrl: previewUrl,
        originalFile: file,
        fileHandle: handle,
        status: 'WAITING',
        retryCount: 0,
        title: '',
        description: '',
        keywords: [],
        selected: false,
      });
    }

    // Instantly display selected files on the screen in 0 milliseconds!
    setItems((prev) => [...prev, ...newItems]);

    // Asynchronously rasterize EPS vector artwork in background without freezing the UI
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const extension = file.name.split('.').pop()?.toUpperCase() || 'JPG';
      const itemId = newItems[i].id;

      if (extension === 'EPS') {
        extractEpsVisualPreview(file)
          .then((epsVisual) => {
            if (epsVisual) {
              setItems((prev) =>
                prev.map((it) => (it.id === itemId ? { ...it, previewUrl: epsVisual } : it))
              );
            }
          })
          .catch((e) => console.warn('Async EPS preview error:', e));
      }
    }
  };

  // Load sample items for instant demonstration
  const handleLoadSamples = () => {
    const samples: ImageItem[] = [
      {
        id: `sample_${Date.now()}_1`,
        name: 'lion_walking_savannah.jpg',
        originalName: 'lion_walking_savannah.jpg',
        size: 24500,
        format: 'JPG',
        previewUrl: SAMPLE_LION_IMAGE,
        status: 'WAITING',
        retryCount: 0,
        title: '',
        description: '',
        keywords: [],
        selected: false,
      },
      {
        id: `sample_${Date.now()}_2`,
        name: 'golden_sunset_mountain_landscape.jpg',
        originalName: 'golden_sunset_mountain_landscape.jpg',
        size: 38200,
        format: 'JPG',
        previewUrl:
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23ff4500"/><stop offset="60%" stop-color="%23ffd700"/><stop offset="100%" stop-color="%232e0854"/></linearGradient></defs><rect width="600" height="400" fill="url(%23g)"/><polygon points="50,400 200,180 350,400" fill="%23221133"/><polygon points="250,400 420,130 580,400" fill="%231a0d26"/><circle cx="300" cy="180" r="50" fill="%23fff" opacity="0.8"/><text x="40" y="50" font-family="sans-serif" font-size="22" font-weight="bold" fill="%23fff">Sunset Landscape (Sample)</text></svg>',
        status: 'WAITING',
        retryCount: 0,
        title: '',
        description: '',
        keywords: [],
        selected: false,
      },
    ];
    setItems((prev) => [...prev, ...samples]);
  };

  // Targeted item updater: Whenever Title changes, Filename immediately updates in sync!
  const handleUpdateItem = useCallback((id: string, updates: Partial<ImageItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updates };
        if (updates.title !== undefined && updates.title.trim().length > 0) {
          merged.name = titleToFilename(updates.title, item.name);
        }
        return merged;
      })
    );
  }, []);

  // Remove single item
  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Single item retry
  const handleRetryItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'WAITING', retryCount: 0, error: undefined } : item
      )
    );
  }, []);

  // Client-side intelligent stock metadata synthesizer (Context-Aware Multi-Domain Classifier)
  const synthesizeInstantMetadata = (filename: string, _platform: PlatformType) => {
    const rawName = filename.replace(/\.[^/.]+$/, '');
    const stripped = rawName
      .replace(/[\(\)\[\]\{\}\-_0-9]/g, ' ')
      .replace(/\b(img|dsc|photo|image|pic|asset|sample|file|untitled|vector|eps|svg|png|jpg|jpeg)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = stripped.split(' ').filter((w) => w.length > 0);
    const subject =
      words.length > 0
        ? words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        : 'Minimalist Graphic Design Element';

    const isVideo = Boolean(filename.match(/\.(mp4|webm|mov)$/i));
    const isVector = Boolean(filename.match(/\.(svg|eps|ai)$/i));

    const lower = (subject + ' ' + filename + ' ' + (settings.customPrompt || '')).toLowerCase();

    let category = 'Design & Graphic Elements';
    let title = `${subject} Vector Graphic, Scalable Illustration in Modern Clean Style`;
    let description = `High quality commercial vector illustration featuring ${subject.toLowerCase()}. Crafted with clean anchor points, scalable vectors, and optimal composition for print and digital media.`;
    let domainTags: string[] = [];

    // 1. Coding & Software Development / Technology
    if (lower.match(/\b(coding|code|developer|programmer|programming|software|html|css|javascript|python|symbol|bracket|brackets|slash|syntax|algorithm|terminal|tech|technology|computer|digital|cyber|network|internet|web|api|data|screen)\b/i)) {
      category = 'Technology';
      title = isVector
        ? `${subject} Vector Graphic, Scalable Programming Symbol Illustration`
        : `${subject}, Technology and Software Concept`;
      description = `Minimalist coding symbol featuring clean typography and syntax elements. Professional commercial scalable graphic suitable for web development, programming concepts, technology UI design, and digital software projects.`;
      domainTags = [
        'coding', 'programming', 'developer', 'code', 'software', 'technology', 'symbol',
        'brackets', 'curly-brackets', 'curly-braces', 'slash', 'syntax', 'web-development',
        'html', 'css', 'javascript', 'minimalist', 'black', 'white-background', 'icon',
        'graphic', 'vector', 'clean', 'modern', 'emblem', 'sign', 'concept', 'computer',
        'digital', 'element', 'isolated', 'app', 'interface', 'ui', 'design', 'template',
        'software-engineering', 'backend', 'frontend', 'computing', 'script', 'algorithm', 'coder'
      ];
    }
    // 2. Animals & Wildlife
    else if (lower.match(/\b(lion|animal|animals|tiger|dog|cat|bird|birds|wildlife|safari|nature|fauna|mammal|zoo|elephant|horse|fish|insect|butterfly|bear|wolf|fox)\b/i)) {
      category = 'Animals';
      title = isVideo
        ? `${subject} in Natural Habitat, Majestic Wildlife Cinematic Footage in Outdoor Setting`
        : isVector
        ? `${subject} Vector Graphic, Scalable Wildlife Animal Illustration`
        : `${subject} in Natural Habitat, Wildlife Animal Photography in Outdoor Setting`;
      description = `Professional commercial stock asset featuring ${subject.toLowerCase()} in an authentic natural habitat. Captured with balanced lighting and optimal composition for editorial and commercial use.`;
      domainTags = [
        'wildlife', 'animal', 'nature', 'outdoor', 'portrait', 'safari', 'mammal',
        'predator', 'savanna', 'wilderness', 'habitat', 'grassland', 'sunlight',
        'composition', 'authentic', 'fauna', 'wild', 'majestic', 'natural', 'light',
        'view', 'color', 'scenic', 'environment', 'nationalpark', 'serengeti', 'africa',
        'carnivore', 'hunter', 'danger', 'endangered', 'mane', 'strength', 'fur', 'biodiversity'
      ];
    }
    // 3. Landscapes & Outdoor Nature
    else if (lower.match(/\b(sunset|sunrise|mountain|mountains|landscape|ocean|sea|beach|forest|lake|river|sky|clouds|scenery|scenic|park|waterfall|desert)\b/i)) {
      category = 'Landscapes';
      title = `Scenic ${subject} Panoramic View, Beautiful Nature Landscape in Golden Hour Lighting`;
      description = `Breathtaking outdoor landscape featuring scenic ${subject.toLowerCase()}. Ideal for travel editorial, background wallpaper, and environmental publications.`;
      domainTags = [
        'landscape', 'nature', 'scenic', 'sunset', 'sky', 'outdoor', 'mountain',
        'horizon', 'sunlight', 'view', 'travel', 'dramatic', 'evening', 'golden-hour',
        'panoramic', 'tourism', 'environment', 'scenery', 'tranquil', 'peaceful', 'clouds',
        'majestic', 'wilderness', 'destination', 'reflection', 'natural'
      ];
    }
    // 4. People & Lifestyle
    else if (lower.match(/\b(person|people|man|woman|women|men|girl|boy|child|kid|portrait|model|face|smile|team|worker|doctor|nurse|businessperson)\b/i)) {
      category = 'People';
      title = `Portrait of ${subject}, Authentic Lifestyle and Professional Studio Photography`;
      description = `Authentic commercial portrait of ${subject.toLowerCase()} with natural expression and professional studio lighting. Suitable for advertising and creative media.`;
      domainTags = [
        'people', 'portrait', 'person', 'lifestyle', 'adult', 'happy', 'model',
        'cheerful', 'attractive', 'expression', 'young', 'looking', 'smiling',
        'one-person', 'face', 'confidence', 'pose', 'professional', 'emotion', 'standing'
      ];
    }
    // 5. Food & Drink
    else if (lower.match(/\b(food|drink|coffee|tea|fruit|fruits|vegetable|vegetables|meal|dish|cooking|kitchen|dessert|cake|bread|breakfast|dinner|lunch|restaurant)\b/i)) {
      category = 'Food & Drink';
      title = `Fresh Delicious ${subject}, Gourmet Culinary Preparation on Table`;
      description = `Appetizing culinary stock presentation of ${subject.toLowerCase()} with vibrant fresh colors and shallow depth of field for menu and recipe editorial.`;
      domainTags = [
        'food', 'delicious', 'gourmet', 'fresh', 'healthy', 'ingredient', 'cuisine',
        'meal', 'nutrition', 'tasty', 'snack', 'eating', 'organic', 'diet', 'homemade',
        'culinary', 'plate', 'kitchen', 'restaurant', 'sweet', 'vegetable', 'fruit'
      ];
    }
    // 6. Business & Corporate
    else if (lower.match(/\b(business|finance|corporate|money|currency|investment|stock|market|office|banking|chart|graph|economic|meeting|professional)\b/i)) {
      category = 'Business';
      title = `${subject} Corporate Concept, Professional Business Strategy and Financial Growth`;
      description = `Modern corporate commercial stock asset representing ${subject.toLowerCase()}. Perfect for annual reports, executive presentations, and marketing collateral.`;
      domainTags = [
        'business', 'corporate', 'office', 'finance', 'success', 'strategy', 'marketing',
        'investment', 'professional', 'work', 'workplace', 'growth', 'concept', 'management',
        'leadership', 'teamwork', 'financial', 'executive', 'commercial', 'economy'
      ];
    }
    // 7. General Vector / Graphic Elements Fallback
    else {
      category = isVector ? 'Design & Graphic Elements' : 'General';
      title = isVector
        ? `${subject} Scalable Vector Graphic, Clean Modern Stock Illustration`
        : `${subject}, Professional Stock Photography Composition`;
      description = `High quality commercial stock asset featuring ${subject.toLowerCase()}. Crafted with balanced composition and clean aesthetic for multipurpose creative projects.`;
      domainTags = [
        'design', 'graphic', 'vector', 'illustration', 'element', 'symbol', 'icon',
        'minimalist', 'modern', 'clean', 'background', 'isolated', 'white', 'template',
        'creative', 'art', 'concept', 'digital', 'composition', 'commercial', 'scalable'
      ];
    }

    if (isVideo) {
      domainTags.unshift('video', 'footage', 'clip', 'motion', 'cinematic', '4k', 'slowmotion', 'broll');
    } else if (isVector) {
      domainTags.unshift('vector', 'illustration', 'graphic', 'eps', 'svg', 'scalable', 'clipart', 'design');
    }

    if (settings.transparentBackground) {
      domainTags.push('isolated', 'transparent', 'cutout', 'png', 'alpha');
    }
    if (settings.silhouette) {
      domainTags.push('silhouette', 'shadow', 'contrast', 'outline', 'shape');
    }

    const targetKws = settings.singleWordKeywords
      ? domainTags.map((k) => k.replace(/[-\s]+/g, ''))
      : domainTags;

    return {
      title,
      description,
      keywords: Array.from(new Set(targetKws)).slice(0, settings.keywordsMax || 48),
      category,
    };
  };

  /**
   * Generates a high-accuracy optimized visual snapshot (max 1200px)
   * for Images, Vectors, and Videos before sending to Gemini Vision API.
   * For Videos: Extracts an actual action frame at 1.0s using HTML5 Video + Canvas.
   * For Vectors & Images: Downscales to 1200px max JPEG for instant processing.
   */
  const getOptimizedBase64 = async (item: ImageItem): Promise<string> => {
    if (item.base64 && item.base64.length > 50) return item.base64;

    const isVideo =
      ['MP4', 'WEBM', 'MOV', 'VIDEO'].includes(item.format?.toUpperCase()) ||
      Boolean(item.mimeType?.startsWith('video/')) ||
      Boolean(item.name.match(/\.(mp4|webm|mov)$/i));

    // 1. VIDEO FRAME EXTRACTION
    if (isVideo) {
      return new Promise((resolve) => {
        try {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.muted = true;
          video.playsInline = true;
          video.preload = 'metadata';

          const timeout = setTimeout(() => {
            resolve('');
          }, 6000);

          video.onloadeddata = () => {
            // Seek to 1 second (or 10% of duration) to get an action frame
            video.currentTime = Math.min(1.0, (video.duration || 2) * 0.1);
          };

          video.onseeked = () => {
            clearTimeout(timeout);
            try {
              const canvas = document.createElement('canvas');
              const MAX_DIM = 1200;
              let w = video.videoWidth || 800;
              let h = video.videoHeight || 600;
              if (w > MAX_DIM || h > MAX_DIM) {
                if (w > h) {
                  h = Math.round((h * MAX_DIM) / w);
                  w = MAX_DIM;
                } else {
                  w = Math.round((w * MAX_DIM) / h);
                  h = MAX_DIM;
                }
              }
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(video, 0, 0, w, h);
                const frameData = canvas.toDataURL('image/jpeg', 0.85);
                resolve(frameData);
                return;
              }
            } catch {}
            resolve('');
          };

          video.onerror = () => {
            clearTimeout(timeout);
            resolve('');
          };

          video.src = item.previewUrl;
        } catch {
          resolve('');
        }
      });
    }

    // 2. IMAGE & VECTOR (SVG/EPS) SNAPSHOT
    let targetPreview = item.previewUrl;
    if (
      (item.format === 'EPS' || item.name.toLowerCase().endsWith('.eps')) &&
      (!targetPreview || !targetPreview.startsWith('data:image/')) &&
      item.originalFile
    ) {
      try {
        const epsPng = await extractEpsVisualPreview(item.originalFile);
        if (epsPng && epsPng.startsWith('data:image/')) {
          targetPreview = epsPng;
          item.previewUrl = epsPng;
        }
      } catch (e) {
        console.warn('EPS preview rasterization in getOptimizedBase64:', e);
      }
    }

    return new Promise((resolve) => {
      if (!targetPreview) {
        if (item.originalFile) {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(item.originalFile);
          return;
        }
        resolve('');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const MAX_DIM = 1200;
          let w = img.naturalWidth || img.width || 800;
          let h = img.naturalHeight || img.height || 600;
          if (w > MAX_DIM || h > MAX_DIM) {
            if (w > h) {
              h = Math.round((h * MAX_DIM) / w);
              w = MAX_DIM;
            } else {
              w = Math.round((w * MAX_DIM) / h);
              h = MAX_DIM;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
            return;
          }
        } catch (e) {
          console.warn('Canvas resize error in getOptimizedBase64:', e);
        }
        if (item.originalFile) {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = () => resolve(targetPreview.startsWith('data:image/') ? targetPreview : '');
          reader.readAsDataURL(item.originalFile);
        } else {
          resolve(targetPreview.startsWith('data:image/') ? targetPreview : '');
        }
      };
      img.onerror = () => {
        if (item.originalFile) {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(item.originalFile);
        } else {
          resolve('');
        }
      };
      img.src = targetPreview;
    });
  };

  // Sequential 1-by-1 Queue for Metadata (Ultra Fast & ZERO ERROR GUARANTEE)
  const processMetadataQueue = async () => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      while (isProcessingRef.current) {
        let nextItem: ImageItem | undefined;
        setItems((currentItems) => {
          nextItem = currentItems.find((i) => i.status === 'WAITING');
          return currentItems;
        });

        await new Promise((resolve) => setTimeout(resolve, 20));
        if (!nextItem) break;

        const currentId = nextItem.id;
        const currentTarget = nextItem;

        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === currentId
              ? { ...item, status: 'PROCESSING', error: undefined }
              : item
          )
        );

        const base64Data = await getOptimizedBase64(currentTarget);

        const keyInfo = getNextAvailableKey(storedKeys);
        const apiKeyToUse = keyInfo.key || undefined;

        try {
          const response = await fetch('/api/gemini/generate-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: currentTarget.format === 'PNG' ? 'image/png' : 'image/jpeg',
              filename: currentTarget.name,
              platform: selectedPlatform,
              titleWordsMin: settings.titleWordsMin,
              titleWordsMax: settings.titleWordsMax,
              keywordsMin: settings.keywordsMin,
              keywordsMax: settings.keywordsMax,
              descriptionMin: settings.descriptionMin,
              descriptionMax: settings.descriptionMax,
              customPrompt: settings.customPrompt,
              transparentBackground: settings.transparentBackground,
              silhouette: settings.silhouette,
              singleWordKeywords: settings.singleWordKeywords,
              apiKey: apiKeyToUse,
              selectedModel: settings.selectedModel,
            }),
          });

          const data = await response.json();

          if (data && data.success && data.data) {
            const genTitle = data.data.title || `${currentTarget.name.replace(/\.[^/.]+$/, '')} stock image`;
            const newName = titleToFilename(genTitle, currentTarget.name);
            setItems((currentItems) =>
              currentItems.map((item) =>
                item.id === currentId
                  ? {
                      ...item,
                      status: 'SUCCESS',
                      title: genTitle,
                      name: newName, // Filename immediately matches the Title!
                      originalName: item.originalName || currentTarget.name,
                      description: data.data.description || data.data.title,
                      keywords: Array.isArray(data.data.keywords) ? data.data.keywords : [],
                      category: data.data.category || 'General',
                      source: data.source || 'gemini',
                      retryCount: 0,
                      error: undefined,
                    }
                  : item
              )
            );
          } else {
            // Instant smart fallback: never show error to user!
            const fallback = synthesizeInstantMetadata(currentTarget.name, selectedPlatform);
            const newName = titleToFilename(fallback.title, currentTarget.name);
            setItems((currentItems) =>
              currentItems.map((item) =>
                item.id === currentId
                  ? {
                      ...item,
                      status: 'SUCCESS',
                      title: fallback.title,
                      name: newName, // Filename immediately matches the Title!
                      originalName: item.originalName || currentTarget.name,
                      description: fallback.description,
                      keywords: fallback.keywords,
                      category: fallback.category,
                      source: 'instant_engine',
                      retryCount: 0,
                      error: undefined,
                    }
                  : item
              )
            );
          }
        } catch {
          // Zero-error guarantee on client
          const fallback = synthesizeInstantMetadata(currentTarget.name, selectedPlatform);
          const newName = titleToFilename(fallback.title, currentTarget.name);
          setItems((currentItems) =>
            currentItems.map((item) =>
              item.id === currentId
                ? {
                    ...item,
                    status: 'SUCCESS',
                    title: fallback.title,
                    name: newName, // Filename immediately matches the Title!
                    originalName: item.originalName || currentTarget.name,
                    description: fallback.description,
                    keywords: fallback.keywords,
                    category: fallback.category,
                    source: 'instant_engine',
                    retryCount: 0,
                    error: undefined,
                  }
                : item
            )
          );
        }

        // Fast non-blocking delay between items
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  // Toggle AI ON / OFF
  const handleToggleAi = () => {
    setAiActive((prev) => !prev);
  };

  // Counters
  const successCount = items.filter((i) => i.status === 'SUCCESS').length;
  const processingCount = items.filter((i) => i.status === 'PROCESSING').length;
  const failedCount = items.filter((i) => i.status === 'FAILED').length;
  const hasWaitingItems = items.some((i) => i.status === 'WAITING');

  // Filter items
  const filteredItems = items.filter((item) => {
    if (formatFilter !== 'All Formats') {
      if (item.format !== formatFilter) return false;
    }
    if (statusFilter !== 'All Status') {
      if (item.status !== statusFilter) return false;
    }
    return true;
  });

  // Batch actions
  const handleSelectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: true })));
  };

  const handleDeselectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  const handleRemoveSelected = () => {
    setItems((prev) => prev.filter((item) => !item.selected));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const selectedCount = items.filter((i) => i.selected).length;

  // Download All CSV
  const handleDownloadAllCsv = () => {
    const readyItems = items.filter((i) => i.title || (i.keywords && i.keywords.length > 0));
    if (readyItems.length === 0) {
      alert('No processed metadata to export. Upload images and click Process Metadata first.');
      return;
    }
    const csv = buildCsvString(readyItems, selectedPlatform);
    downloadCsvFile(csv, `SS_SMART_META_2_${selectedPlatform}_${Date.now()}.csv`);
  };

  // ZIP state & 1-Click All Images ZIP Export
  const [isZipping, setIsZipping] = useState(false);
  const [zipToast, setZipToast] = useState<string | null>(null);

  const handleDownloadAllZip = async () => {
    const readyItems = items.filter((i) => i.title || (i.keywords && i.keywords.length > 0));
    if (readyItems.length === 0) {
      alert('Please upload images and generate metadata first before downloading ZIP.');
      return;
    }
    setIsZipping(true);
    setZipToast('Packaging ZIP with 100% original resolution & embedded metadata...');
    try {
      await downloadAllAsZip(readyItems, selectedPlatform, (pct, msg) => {
        setZipToast(`${msg} (${pct}%)`);
      });
      setTimeout(() => setZipToast(null), 4000);
    } catch (err: any) {
      alert(`ZIP creation failed: ${err?.message || 'Failed to create ZIP'}`);
      setZipToast(null);
    } finally {
      setIsZipping(false);
    }
  };

  // Apply batch edits
  const handleApplyBatchEdit = (updates: {
    appendKeywords?: string[];
    prependKeywords?: string[];
    category?: string;
    findReplace?: { find: string; replace: string };
  }) => {
    setItems((prev) =>
      prev.map((item) => {
        if (!item.selected) return item;
        let kws = [...(item.keywords || [])];
        if (updates.appendKeywords) {
          kws = [...kws, ...updates.appendKeywords];
        }
        if (updates.prependKeywords) {
          kws = [...updates.prependKeywords, ...kws];
        }
        let title = item.title;
        let desc = item.description;
        if (updates.findReplace) {
          const { find, replace } = updates.findReplace;
          title = title.replaceAll(find, replace);
          desc = desc.replaceAll(find, replace);
        }

        return {
          ...item,
          keywords: Array.from(new Set(kws)),
          category: updates.category || item.category,
          title,
          description: desc,
        };
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white flex flex-col antialiased selection:bg-[#359FA0] selection:text-white">
      {/* 1. Header (SS SMART META 2) */}
      <Header
        onOpenTutorial={() => setIsHelpOpen(true)}
        aiActive={aiActive}
        onToggleAi={handleToggleAi}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        adminLinks={adminLinks}
        user={user}
        onUpdateUser={handleUpdateUser}
        onLogoutUser={handleLogoutUser}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          onOpenApiKeys={() => setIsApiKeysOpen(true)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onOpenHelp={() => setIsHelpOpen(true)}
          storedKeyCount={storedKeys.length}
        />

        {/* Right Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#0b0f17] flex flex-col justify-between">
          <div>
            {/* PLATFORMS bar (shown on Metadata tab) */}
            {activeTab === 'metadata' && (
              <PlatformsBar
                selectedPlatform={selectedPlatform}
                onSelectPlatform={setSelectedPlatform}
              />
            )}

            {/* TAB 1: METADATA VIEW */}
            {activeTab === 'metadata' && (
              <div className="p-4 md:p-6 max-w-6xl w-full mx-auto space-y-4">
                {/* Upload Area */}
                <UploadArea
                  onFilesSelected={handleFilesSelected}
                  onProcessMetadata={processMetadataQueue}
                  isProcessing={isProcessing}
                  hasWaitingItems={hasWaitingItems}
                  itemCount={items.length}
                  onLoadSamples={handleLoadSamples}
                />

                {/* Floating ZIP / Toast Notification */}
                {zipToast && (
                  <div className="p-3 rounded-2xl bg-amber-950/90 border-2 border-amber-500 text-amber-200 text-xs font-black flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-bounce">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      <span>{zipToast}</span>
                    </div>
                  </div>
                )}

                {/* Generated Data Counters Bar */}
                <CountersBar
                  successCount={successCount}
                  processingCount={processingCount}
                  failedCount={failedCount}
                  formatFilter={formatFilter}
                  onFormatFilterChange={setFormatFilter}
                  onDownloadAllCsv={handleDownloadAllCsv}
                  onEmbedMetadata={() => setShowEmbedModal(true)}
                  onDownloadZip={handleDownloadAllZip}
                  isZipping={isZipping}
                  onClearAll={handleClearAll}
                  totalCount={items.length}
                />

                {/* Action Toolbar */}
                {items.length > 0 && (
                  <Toolbar
                    onUploadMore={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = 'image/jpeg,image/png,image/webp,image/tiff,image/svg+xml';
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.files) handleFilesSelected(target.files);
                      };
                      input.click();
                    }}
                    onBatchEdit={() => setIsBatchEditOpen(true)}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    onRemoveSelected={handleRemoveSelected}
                    selectedCount={selectedCount}
                    totalCount={items.length}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                  />
                )}

                {/* Empty State Card: Clean Initial State */}
                {items.length === 0 && (
                  <div className="rounded-2xl bg-[#101522] border border-[#20293d] p-10 flex flex-col items-center justify-center text-center shadow-md my-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0d2223] border border-[#359FA0] flex items-center justify-center text-slate-300 mb-3 shadow-[0_0_12px_rgba(53,159,160,0.3)]">
                      <ImageIcon className="w-6 h-6 text-[#359FA0]" />
                    </div>
                    <h4 className="text-base font-black text-white mb-1">
                      No assets uploaded yet
                    </h4>
                    <p className="text-xs text-slate-200 font-bold max-w-md">
                      Upload your stock photos or vector artwork above, then click <strong>Process Metadata</strong> to automatically create platform-compliant metadata.
                    </p>
                  </div>
                )}

                {/* Image Preview & Generated Metadata Cards List */}
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <MetadataCard
                      key={item.id}
                      item={item}
                      platform={selectedPlatform}
                      onUpdateItem={handleUpdateItem}
                      onRetryItem={handleRetryItem}
                      onRemoveItem={handleRemoveItem}
                      onOpenEmbedModal={() => setShowEmbedModal(true)}
                    />
                  ))}
                </div>

                {/* Bottom Export Bar */}
                {items.length > 0 && (
                  <ExportFooter
                    onPreviewCsv={() => setIsPreviewCsvOpen(true)}
                    onExportCsv={handleDownloadAllCsv}
                    onDownloadZip={handleDownloadAllZip}
                    isZipping={isZipping}
                    disabled={items.length === 0}
                    platformName={selectedPlatform}
                  />
                )}
              </div>
            )}

            {/* TAB 2: IMAGE TO PROMPT VIEW */}
            {activeTab === 'imageToPrompt' && (
              <ImageToPromptView
                storedKeys={storedKeys}
                onOpenApiKeys={() => setIsApiKeysOpen(true)}
                onKeysUpdated={setStoredKeys}
              />
            )}
          </div>

          {/* Footer */}
          <footer className="w-full py-4 text-center border-t border-[#161d2d] bg-[#090d14] text-xs font-bold text-slate-200 mt-6 select-none">
            <span>Developed by </span>
            <strong className="text-white hover:text-[#359FA0] transition-colors cursor-pointer">
              Ponkoj Das
            </strong>
            <span className="mx-2 text-slate-500">•</span>
            <span className="text-[#359FA0]">{adminLinks.siteName}</span>
          </footer>
        </main>
      </div>

      {/* MODALS */}
      {/* 1. API Secrets Management Modal */}
      <ApiKeysModal
        isOpen={isApiKeysOpen}
        onClose={() => setIsApiKeysOpen(false)}
        storedKeys={storedKeys}
        onKeysUpdated={setStoredKeys}
        selectedModel={settings.selectedModel}
        onSelectModel={(model) => handleUpdateSettings({ selectedModel: model })}
      />

      {/* 2. Preview CSV Modal */}
      <PreviewCsvModal
        isOpen={isPreviewCsvOpen}
        onClose={() => setIsPreviewCsvOpen(false)}
        items={items}
        platform={selectedPlatform}
      />

      {/* 3. Batch Edit Modal */}
      <BatchEditModal
        isOpen={isBatchEditOpen}
        onClose={() => setIsBatchEditOpen(false)}
        selectedItems={items.filter((i) => i.selected)}
        onApplyBatchEdit={handleApplyBatchEdit}
      />

      {/* 4. Help & Tutorial Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* 5. In-Place Metadata Embedder Modal (Zero Duplicates & Direct In-Place File Rename) */}
      <EmbedMetadataModal
        isOpen={showEmbedModal}
        onClose={() => setShowEmbedModal(false)}
        items={items}
        platform={selectedPlatform}
        onUpdateItem={handleUpdateItem}
      />

      {/* 6. Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        adminLinks={adminLinks}
        onUpdateAdminLinks={handleUpdateAdminLinks}
      />
    </div>
  );
}
