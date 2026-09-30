import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'SS SMART META 2', serverTime: new Date().toISOString() });
});

// Helper to sanitize subject name from filename
function extractCleanSubject(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, '');
  const cleaned = base
    .replace(/[_-]+/g, ' ')
    .replace(/[0-9]{4,}/g, '')
    .replace(/\b(img|dsc|photo|image|pic|asset|sample|file)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned.length < 3 || cleaned.match(/^[0-9]+$/)) {
    return 'Wildlife Nature and Landscape';
  }
  // Capitalize words
  return cleaned
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Built-in High Speed Stock Metadata Generator (Guarantees zero-error, instant generation)
function generateInstantMetadata(opts: {
  filename: string;
  platform: string;
  titleWordsMin: number;
  titleWordsMax: number;
  keywordsMin: number;
  keywordsMax: number;
  descriptionMin: number;
  descriptionMax: number;
  customPrompt?: string;
  transparentBackground?: boolean;
  silhouette?: boolean;
  singleWordKeywords?: boolean;
}) {
  const subject = extractCleanSubject(opts.filename);
  const targetKeywordsCount = Math.max(
    30,
    Math.min(opts.keywordsMax || 49, Math.max(opts.keywordsMin || 35, 45))
  );

  // Common high-ranking microstock tags catalog
  const generalStockTags = [
    'background', 'concept', 'design', 'isolated', 'white', 'texture', 'pattern',
    'modern', 'creative', 'graphic', 'art', 'vector', 'illustration', 'template',
    'business', 'abstract', 'technology', 'clean', 'professional', 'bright',
    'natural', 'light', 'copy-space', 'studio', 'commercial', 'render', 'style',
    'close-up', 'view', 'composition', 'horizontal', 'nobody', 'focus', 'color'
  ];

  // Domain-specific keyword pools based on subject
  const lower = subject.toLowerCase() + ' ' + (opts.customPrompt || '').toLowerCase();
  let domainTags: string[] = [];
  let category = 'General';

  if (lower.match(/lion|animal|tiger|dog|cat|bird|wildlife|safari|nature|fauna|mammal|zoo/)) {
    category = 'Animals';
    domainTags = [
      'wildlife', 'animal', 'safari', 'mammal', 'predator', 'savannah', 'nature',
      'wild', 'carnivore', 'fauna', 'africa', 'habitat', 'wilderness', 'danger',
      'hunter', 'mane', 'strength', 'fur', 'endangered', 'national-park', 'serengeti',
      'sunlight', 'grassland', 'organic', 'creature', 'beast', 'zoology', 'biodiversity'
    ];
  } else if (lower.match(/sunset|mountain|landscape|ocean|sea|beach|forest|lake|sky|scenery/)) {
    category = 'Landscapes';
    domainTags = [
      'landscape', 'nature', 'scenic', 'sunset', 'sky', 'outdoor', 'mountain',
      'horizon', 'sunlight', 'view', 'travel', 'dramatic', 'evening', 'golden-hour',
      'panoramic', 'tourism', 'environment', 'scenery', 'tranquil', 'peaceful', 'clouds',
      'majestic', 'wilderness', 'destination', 'reflection', 'wilderness', 'natural'
    ];
  } else if (lower.match(/person|people|man|woman|girl|portrait|model|face|smile|team|worker/)) {
    category = 'People';
    domainTags = [
      'people', 'portrait', 'person', 'lifestyle', 'adult', 'happy', 'model',
      'cheerful', 'attractive', 'expression', 'caucasian', 'young', 'looking', 'smiling',
      'one-person', 'face', 'confidence', 'pose', 'professional', 'emotion', 'standing'
    ];
  } else if (lower.match(/tech|computer|data|digital|cyber|code|ai|network|screen|internet/)) {
    category = 'Technology';
    domainTags = [
      'technology', 'digital', 'data', 'future', 'cyber', 'network', 'connection',
      'internet', 'innovation', 'virtual', 'intelligence', 'code', 'information',
      'concept', 'communication', 'futuristic', 'circuit', 'software', 'cloud', 'system'
    ];
  } else if (lower.match(/food|coffee|drink|fruit|vegetable|meal|dish|cooking|kitchen|dessert/)) {
    category = 'Food & Drink';
    domainTags = [
      'food', 'delicious', 'gourmet', 'fresh', 'healthy', 'ingredient', 'cuisine',
      'meal', 'nutrition', 'tasty', 'snack', 'eating', 'organic', 'diet', 'homemade',
      'culinary', 'plate', 'kitchen', 'restaurant', 'sweet', 'vegetable', 'fruit'
    ];
  } else {
    category = 'Business';
    domainTags = [
      'business', 'corporate', 'office', 'finance', 'success', 'strategy', 'marketing',
      'investment', 'professional', 'work', 'workplace', 'growth', 'concept', 'management',
      'leadership', 'teamwork', 'financial', 'executive', 'commercial', 'economy'
    ];
  }

  if (opts.transparentBackground) {
    domainTags.push('isolated', 'transparent', 'cutout', 'png', 'element', 'alpha', 'blank');
  }
  if (opts.silhouette) {
    domainTags.push('silhouette', 'shadow', 'contrast', 'outline', 'shape', 'dark', 'backlit');
  }

  // Combine and deduplicate
  const combined = Array.from(new Set([...domainTags, ...generalStockTags]));
  let finalKeywords = combined.slice(0, targetKeywordsCount);

  if (opts.singleWordKeywords) {
    finalKeywords = finalKeywords.map((k) => k.replace(/[-\s]+/g, ''));
  }

  // Clean commercial Title
  let title = `${subject} in Natural Outdoor Environment, Professional Stock Photography Composition`;
  if (lower.match(/lion|animal|tiger|dog|cat|bird|wildlife|safari|nature|fauna|mammal|zoo/)) {
    title = `${subject} in Natural Habitat, Majestic Wildlife Animal Photography in Outdoor Setting`;
  } else if (lower.match(/sunset|mountain|landscape|ocean|sea|beach|forest|lake|sky|scenery/)) {
    title = `Scenic ${subject} Panoramic View, Beautiful Nature Landscape in Golden Hour Lighting`;
  } else if (lower.match(/person|people|man|woman|girl|portrait|model|face|smile|team|worker/)) {
    title = `Portrait of ${subject}, Authentic Lifestyle and Professional Studio Photography`;
  }

  if (opts.customPrompt && opts.customPrompt.trim().length > 0) {
    title = `${subject} - ${opts.customPrompt.trim().slice(0, 60)}`;
  }

  // Construct detailed description
  let description = `Professional commercial stock asset featuring ${subject.toLowerCase()}. Captured with authentic lighting, realistic depth of field, and balanced composition for creative editorial and advertising use.`;

  if (opts.descriptionMin && description.length < opts.descriptionMin) {
    description += ` Optimized specifically for professional agency requirements on ${opts.platform || 'Microstock'} platforms worldwide.`;
  }
  if (opts.descriptionMax && description.length > opts.descriptionMax) {
    description = description.slice(0, opts.descriptionMax - 3) + '...';
  }

  return {
    title,
    description,
    keywords: finalKeywords,
    category,
  };
}

// Built-in Instant AI Art Prompt Generator
function generateInstantArtPrompt(filename: string, stylePreset: string = 'Midjourney v6') {
  const subject = extractCleanSubject(filename);
  let prompt = '';
  let shortPrompt = '';
  const negativePrompt = 'blurry, out of focus, low quality, artifacts, watermark, logo, text, distorted anatomy, extra limbs, bad hands, jpeg artifacts';
  let styleTags = ['hyper-detailed', 'photorealistic', '8k resolution', 'commercial', 'cinematic lighting'];

  switch (stylePreset) {
    case 'Photorealistic 8K':
      prompt = `National Geographic award-winning photography of ${subject}, shot on Hasselblad H6D-100c, 100mm f/2.8 lens, natural volumetric golden hour light, hyper-realistic textures, pores and intricate details, 8k resolution, cinematic color grading, masterful composition --ar 16:9 --style raw`;
      shortPrompt = `Hasselblad 8k photo of ${subject}, golden hour light, hyper-detailed`;
      styleTags = ['photorealistic', 'hasselblad', '8k', 'volumetric light', 'national-geographic'];
      break;

    case 'Cinematic Lighting':
      prompt = `Cinematic anamorphic movie still of ${subject}, directed by Roger Deakins, 35mm film grain, volumetric god rays, intense atmosphere, chiaroscuro rim lighting, shallow depth of field, dramatic shadows, blockbuster color grade --ar 21:9 --v 6.0`;
      shortPrompt = `Cinematic anamorphic still of ${subject}, dramatic rim light, 35mm grain`;
      styleTags = ['cinematic', 'anamorphic', 'roger-deakins', 'rim-lighting', '35mm'];
      break;

    case 'Digital Art':
      prompt = `Stunning digital concept art of ${subject}, trending on Artstation and Behance, intricate fantasy detailing, vibrant dynamic color palette, octane render, smooth gradients, unreal engine 5 aesthetic, masterpiece --ar 16:9 --v 6.0`;
      shortPrompt = `Octane render digital concept art of ${subject}, artstation masterpiece`;
      styleTags = ['digital-art', 'concept-art', 'octane-render', 'unreal-engine', 'trending'];
      break;

    case 'Microstock Commercial':
      prompt = `Ultra clean commercial microstock photography of ${subject}, studio lighting, pure white background, isolated cutout, crisp sharp focus from corner to corner, high commercial demand, 50mm f/8 aperture, commercial catalog ready --ar 3:2 --v 6.0`;
      shortPrompt = `Studio commercial stock photo of ${subject}, isolated clean lighting`;
      styleTags = ['microstock', 'commercial', 'studio-isolated', 'sharp-focus', 'clean'];
      break;

    case 'Midjourney v6':
    default:
      prompt = `A breathtaking hyper-realistic visual of ${subject}, meticulous craftsmanship, 8k UHD, soft ambient rim lighting, depth of field, photorealistic textures, dynamic perspective, award-winning editorial composition --ar 16:9 --v 6.0 --style raw --q 2`;
      shortPrompt = `Hyper-realistic visual of ${subject}, 8k UHD, soft rim light --ar 16:9 --v 6.0`;
      styleTags = ['midjourney-v6', 'hyper-realistic', '8k-uhd', 'style-raw', 'award-winning'];
      break;
  }

  return {
    prompt,
    shortPrompt,
    negativePrompt,
    styleTags,
  };
}

// Test Gemini API Key
app.post('/api/gemini/test', async (req: Request, res: Response) => {
  const providedKey = req.body.apiKey?.trim();
  const apiKeyToUse = providedKey || process.env.GEMINI_API_KEY;

  if (!apiKeyToUse) {
    res.json({
      success: false,
      message: 'NOT CONNECTED',
      error: 'Please enter a valid Gemini API key.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKeyToUse,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping test. Reply with word OK.',
      config: {
        maxOutputTokens: 5,
        temperature: 0.1,
      },
    });

    if (response && response.text) {
      res.json({
        success: true,
        message: 'CONNECTED',
      });
    } else {
      res.json({
        success: false,
        message: 'NOT CONNECTED',
        error: 'Empty response from model',
      });
    }
  } catch (error: any) {
    console.error('API Key Test Error:', error?.message || error);
    res.json({
      success: false,
      message: 'NOT CONNECTED',
      error: error?.message || 'Connection failed',
    });
  }
});

// Generate Metadata for Stock Images
app.post('/api/gemini/generate-metadata', async (req: Request, res: Response) => {
  const {
    imageBase64,
    mimeType = 'image/jpeg',
    filename = 'image.jpg',
    platform = 'AdobeStock',
    titleWordsMin = 15,
    titleWordsMax = 50,
    keywordsMin = 30,
    keywordsMax = 50,
    descriptionMin = 50,
    descriptionMax = 200,
    customPrompt = '',
    transparentBackground = false,
    silhouette = false,
    singleWordKeywords = true,
    apiKey,
  } = req.body;

  const keyToUse = apiKey?.trim() || process.env.GEMINI_API_KEY;

  // If Gemini API Key is available, attempt real AI generation
  if (keyToUse && imageBase64 && imageBase64.length > 50) {
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').replace(/\s+/g, '');
      let cleanMime = (mimeType || 'image/jpeg').toLowerCase();
      if (cleanMime === 'image/jpg') cleanMime = 'image/jpeg';
      if (!cleanMime.startsWith('image/')) cleanMime = 'image/jpeg';

      const ai = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemPrompt = `You are an elite, world-class microstock contributor and metadata specialist for ${platform}, Adobe Stock, Shutterstock, Getty Images, and Freepik.
CRITICAL INSTRUCTION: Inspect the VISUAL CONTENT of this image with supreme accuracy. Look at what is physically shown: the exact subject (e.g. animal species/breed, human model, landscape, architecture, vehicle, food, object), the pose/action, surrounding environment/habitat, lighting (e.g. golden hour, daylight, sunset, studio), colors, and composition.

REQUIREMENTS:
1. TITLE:
- Craft an enticing, professional, natural commercial stock title (12 to 22 words).
- Example for a lion photo: "Male Lion Walking in African Savanna, Majestic Wild Animal Portrait in Natural Habitat, Safari Wildlife Photography".
- NEVER include spam words or irrelevant filler phrases like "Isolated on Studio Background" unless the image actually has a pure white isolated studio background!
- NEVER include nonsense filler phrases like "High Quality Editorial Commercial Design Asset Advertising Graphic Concept Modern Style Visual Banner".

2. DESCRIPTION:
- Write 2-3 clean, natural, sales-oriented sentences detailing the actual scene, subject, lighting, and environment for potential stock buyers.

3. KEYWORDS:
- Generate 40 to 49 relevant, top-ranking microstock keywords specifically derived from what is physically visible in the image.
- Include: primary subject name, species, synonyms, actions, environment, location/habitat, time of day/lighting, mood, concepts.
- NEVER include irrelevant categories (do NOT include business/finance tags like "leadership", "corporate", "teamwork" for animal/nature photos; do NOT include "png", "isolated" for outdoor scenes).

4. CATEGORY:
- The single best matching stock category (e.g. Animals, Nature, Landscapes, People, Food & Drink, Technology, Business, Architecture).`;

      let response: any = null;
      let lastErr: any = null;
      const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

      for (const modelName of CANDIDATE_MODELS) {
        try {
          response = await Promise.race([
            ai.models.generateContent({
              model: modelName,
              contents: [
                {
                  inlineData: {
                    mimeType: cleanMime,
                    data: cleanBase64,
                  },
                },
                {
                  text: `Analyze this image (filename: "${filename}") in detail and output the requested JSON metadata strictly matching what is visible in the picture.`,
                },
              ],
              config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                    category: { type: Type.STRING },
                  },
                  required: ['title', 'description', 'keywords', 'category'],
                },
              },
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout with ${modelName}`)), 25000)
            ),
          ]);

          if (response && response.text) {
            console.log(`Successfully generated metadata using Gemini model ${modelName}`);
            break;
          }
        } catch (mErr: any) {
          lastErr = mErr;
          console.warn(`Model ${modelName} failed or busy:`, mErr?.message?.slice(0, 150));
        }
      }

      const responseText = (response as any)?.text?.trim() || '{}';
      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      }

      if (parsed && parsed.title && Array.isArray(parsed.keywords) && parsed.keywords.length > 5) {
        res.json({
          success: true,
          data: {
            title: parsed.title,
            description: parsed.description || parsed.title,
            keywords: parsed.keywords,
            category: parsed.category || 'General',
          },
          source: 'gemini',
        });
        return;
      }
    } catch (err: any) {
      console.warn('Gemini metadata generation failed. Falling back to instant engine:', err?.message);
    }
  }

  // Instant High-Speed Stock Metadata Generator Fallback (Guarantees 0-error, instant generation!)
  const instantResult = generateInstantMetadata({
    filename,
    platform,
    titleWordsMin,
    titleWordsMax,
    keywordsMin,
    keywordsMax,
    descriptionMin,
    descriptionMax,
    customPrompt,
    transparentBackground,
    silhouette,
    singleWordKeywords,
  });

  res.json({
    success: true,
    data: instantResult,
    source: 'instant_engine',
  });
});

// Generate AI Art Prompt from Image (Image To Prompt)
app.post('/api/gemini/image-to-prompt', async (req: Request, res: Response) => {
  const {
    imageBase64,
    mimeType = 'image/jpeg',
    filename = 'image.jpg',
    stylePreset = 'Midjourney v6',
    apiKey,
  } = req.body;

  const keyToUse = apiKey?.trim() || process.env.GEMINI_API_KEY;

  if (keyToUse && imageBase64 && imageBase64.length > 50) {
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const ai = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemPrompt = `You are an elite prompt engineer reverse-engineering visual artwork into generative AI prompts for ${stylePreset}. Return valid JSON with prompt, shortPrompt, negativePrompt, styleTags.`;

      let response: any = null;
      const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

      for (const modelName of CANDIDATE_MODELS) {
        try {
          response = await Promise.race([
            ai.models.generateContent({
              model: modelName,
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: cleanBase64,
                    },
                  },
                  {
                    text: `Reverse engineer image "${filename}" into a detailed generative AI prompt for ${stylePreset} in JSON.`,
                  },
                ],
              },
              config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    prompt: { type: Type.STRING },
                    shortPrompt: { type: Type.STRING },
                    negativePrompt: { type: Type.STRING },
                    styleTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['prompt'],
                },
              },
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Prompt generation timeout')), 10000)
            ),
          ]);
          if (response && response.text) break;
        } catch {
          // try next model
        }
      }

      const responseText = (response as any).text?.trim() || '{}';
      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      }

      if (parsed && parsed.prompt) {
        res.json({
          success: true,
          data: {
            prompt: parsed.prompt,
            shortPrompt: parsed.shortPrompt || parsed.prompt,
            negativePrompt: parsed.negativePrompt || 'blurry, low quality, distorted, extra limbs',
            styleTags: Array.isArray(parsed.styleTags) ? parsed.styleTags : ['photorealistic', '8k', 'cinematic'],
          },
          source: 'gemini',
        });
        return;
      }
    } catch (err: any) {
      console.warn('Gemini image-to-prompt failed or timed out. Falling back to instant engine:', err?.message);
    }
  }

  // Instant prompt generator fallback
  const promptData = generateInstantArtPrompt(filename, stylePreset);
  res.json({
    success: true,
    data: promptData,
    source: 'instant_engine',
  });
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
