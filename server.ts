import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
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

// High-Fidelity Native Ghostscript & ImageMagick EPS Vector Preview Renderer
app.post('/api/render-eps', express.raw({ type: '*/*', limit: '60mb' }), async (req: Request, res: Response) => {
  try {
    const buffer = req.body;
    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'No EPS data provided' });
    }

    const tempId = `eps_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const tempInput = path.join('/tmp', `${tempId}.eps`);
    const tempOutput = path.join('/tmp', `${tempId}.png`);

    fs.writeFileSync(tempInput, buffer);

    let rendered = false;

    // 1. Ghostscript with precise -dEPSCrop (renders exact bounding box & sharp anti-aliasing)
    try {
      execSync(
        `gs -dSAFER -dBATCH -dNOPAUSE -dEPSCrop -sDEVICE=png16m -dGraphicsAlphaBits=4 -dTextAlphaBits=4 -r150 -sOutputFile="${tempOutput}" "${tempInput}"`,
        { timeout: 8000 }
      );
      if (fs.existsSync(tempOutput) && fs.statSync(tempOutput).size > 100) {
        rendered = true;
      }
    } catch {
      // 2. Fallback: Ghostscript standard page fit
      try {
        execSync(
          `gs -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -dGraphicsAlphaBits=4 -dTextAlphaBits=4 -r150 -sOutputFile="${tempOutput}" "${tempInput}"`,
          { timeout: 8000 }
        );
        if (fs.existsSync(tempOutput) && fs.statSync(tempOutput).size > 100) {
          rendered = true;
        }
      } catch {
        // 3. Fallback: ImageMagick convert
        try {
          execSync(`convert -density 150 -background white -flatten "${tempInput}" "${tempOutput}"`, {
            timeout: 8000,
          });
          if (fs.existsSync(tempOutput) && fs.statSync(tempOutput).size > 100) {
            rendered = true;
          }
        } catch {}
      }
    }

    if (rendered && fs.existsSync(tempOutput)) {
      const pngBuffer = fs.readFileSync(tempOutput);
      const base64 = `data:image/png;base64,${pngBuffer.toString('base64')}`;

      try {
        fs.unlinkSync(tempInput);
        fs.unlinkSync(tempOutput);
      } catch {}

      return res.json({ success: true, previewUrl: base64 });
    } else {
      try {
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
      } catch {}
      return res.status(500).json({ error: 'Failed to rasterize EPS' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'EPS conversion error' });
  }
});

// Helper to sanitize subject name from filename
function extractCleanSubject(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, '');
  const stripped = base
    .replace(/[\(\)\[\]\{\}\-_0-9]/g, ' ')
    .replace(/\b(img|dsc|photo|image|pic|asset|sample|file|untitled|vector|eps|svg|png|jpg|jpeg)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = stripped.split(' ').filter((w) => w.length > 0);
  if (words.length === 0) {
    return 'Minimalist Graphic Design Element';
  }

  // Capitalize words
  return words
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
  const lower = (subject + ' ' + opts.filename + ' ' + (opts.customPrompt || '')).toLowerCase();
  let domainTags: string[] = [];
  let category = 'General';

  // 1. Coding & Software Development / Technology
  if (lower.match(/\b(coding|code|developer|programmer|programming|software|html|css|javascript|python|symbol|bracket|brackets|slash|syntax|algorithm|terminal|tech|technology|computer|digital|cyber|network|internet|web|api|data|screen)\b/i)) {
    category = 'Technology';
    domainTags = [
      'coding', 'programming', 'developer', 'code', 'software', 'technology', 'symbol',
      'brackets', 'curly-brackets', 'curly-braces', 'slash', 'syntax', 'web-development',
      'html', 'css', 'javascript', 'minimalist', 'black', 'white-background', 'icon',
      'graphic', 'vector', 'clean', 'modern', 'emblem', 'sign', 'concept', 'computer',
      'digital', 'element', 'isolated', 'app', 'interface', 'ui', 'design', 'template',
      'software-engineering', 'backend', 'frontend', 'computing', 'script', 'algorithm', 'coder'
    ];
  } else if (lower.match(/\b(lion|animal|animals|tiger|dog|cat|bird|birds|wildlife|safari|nature|fauna|mammal|zoo|elephant|horse|fish|insect|butterfly|bear|wolf|fox)\b/i)) {
    category = 'Animals';
    domainTags = [
      'wildlife', 'animal', 'safari', 'mammal', 'predator', 'savannah', 'nature',
      'wild', 'carnivore', 'fauna', 'africa', 'habitat', 'wilderness', 'danger',
      'hunter', 'mane', 'strength', 'fur', 'endangered', 'national-park', 'serengeti',
      'sunlight', 'grassland', 'organic', 'creature', 'beast', 'zoology', 'biodiversity'
    ];
  } else if (lower.match(/\b(sunset|sunrise|mountain|mountains|landscape|ocean|sea|beach|forest|lake|river|sky|clouds|scenery|scenic|park|waterfall|desert)\b/i)) {
    category = 'Landscapes';
    domainTags = [
      'landscape', 'nature', 'scenic', 'sunset', 'sky', 'outdoor', 'mountain',
      'horizon', 'sunlight', 'view', 'travel', 'dramatic', 'evening', 'golden-hour',
      'panoramic', 'tourism', 'environment', 'scenery', 'tranquil', 'peaceful', 'clouds',
      'majestic', 'wilderness', 'destination', 'reflection', 'wilderness', 'natural'
    ];
  } else if (lower.match(/\b(person|people|man|woman|women|men|girl|boy|child|kid|portrait|model|face|smile|team|worker|doctor|nurse|businessperson)\b/i)) {
    category = 'People';
    domainTags = [
      'people', 'portrait', 'person', 'lifestyle', 'adult', 'happy', 'model',
      'cheerful', 'attractive', 'expression', 'young', 'looking', 'smiling',
      'one-person', 'face', 'confidence', 'pose', 'professional', 'emotion', 'standing'
    ];
  } else if (lower.match(/\b(food|drink|coffee|tea|fruit|fruits|vegetable|vegetables|meal|dish|cooking|kitchen|dessert|cake|bread|breakfast|dinner|lunch|restaurant)\b/i)) {
    category = 'Food & Drink';
    domainTags = [
      'food', 'delicious', 'gourmet', 'fresh', 'healthy', 'ingredient', 'cuisine',
      'meal', 'nutrition', 'tasty', 'snack', 'eating', 'organic', 'diet', 'homemade',
      'culinary', 'plate', 'kitchen', 'restaurant', 'sweet', 'vegetable', 'fruit'
    ];
  } else if (lower.match(/\b(business|finance|corporate|money|currency|investment|stock|market|office|banking|chart|graph|economic|meeting|professional)\b/i)) {
    category = 'Business';
    domainTags = [
      'business', 'corporate', 'office', 'finance', 'success', 'strategy', 'marketing',
      'investment', 'professional', 'work', 'workplace', 'growth', 'concept', 'management',
      'leadership', 'teamwork', 'financial', 'executive', 'commercial', 'economy'
    ];
  } else {
    category = 'Design & Graphic Elements';
    domainTags = [
      'design', 'graphic', 'vector', 'illustration', 'element', 'symbol', 'icon',
      'minimalist', 'modern', 'clean', 'background', 'isolated', 'white', 'template',
      'creative', 'art', 'concept', 'digital', 'composition', 'commercial', 'scalable'
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

  const isVideo = Boolean(opts.filename?.match(/\.(mp4|webm|mov)$/i)) || Boolean((opts as any).isVideo);
  const isVector = Boolean(opts.filename?.match(/\.(svg|eps|ai)$/i)) || Boolean((opts as any).isVector);

  // Clean commercial Title
  let title = isVector
    ? `${subject} Scalable Vector Graphic, Clean Modern Stock Illustration`
    : `${subject}, Professional Stock Photography Composition`;

  if (category === 'Technology') {
    title = isVector
      ? `${subject} Vector Graphic, Scalable Programming Symbol Illustration`
      : `${subject}, Technology and Software Concept`;
  } else if (category === 'Animals') {
    title = isVideo
      ? `${subject} in Natural Habitat, Majestic Wildlife Cinematic Footage in Outdoor Setting`
      : isVector
      ? `${subject} Vector Graphic, Scalable Wildlife Animal Illustration`
      : `${subject} in Natural Habitat, Majestic Wildlife Animal Photography in Outdoor Setting`;
  } else if (category === 'Landscapes') {
    title = `Scenic ${subject} Panoramic View, Beautiful Nature Landscape in Golden Hour Lighting`;
  } else if (category === 'People') {
    title = `Portrait of ${subject}, Authentic Lifestyle and Professional Studio Photography`;
  } else if (category === 'Food & Drink') {
    title = `Fresh Delicious ${subject}, Gourmet Culinary Preparation on Table`;
  } else if (category === 'Business') {
    title = `${subject} Corporate Concept, Professional Business Strategy and Financial Growth`;
  }

  if (opts.customPrompt && opts.customPrompt.trim().length > 0) {
    title = `${subject} - ${opts.customPrompt.trim().slice(0, 60)}`;
  }

  // Construct detailed description
  let description = isVideo
    ? `High-definition commercial stock video footage featuring ${subject.toLowerCase()} in motion. Captured with smooth camera stabilization, authentic natural lighting, and cinematic depth of field for professional broadcasting and creative video production.`
    : isVector
    ? `High quality scalable commercial vector illustration featuring ${subject.toLowerCase()}. Crafted with clean anchor points, editable paths, and vibrant microstock-compliant colors for print and digital design.`
    : `Professional commercial stock asset featuring ${subject.toLowerCase()}. Captured with authentic lighting, realistic depth of field, and balanced composition for creative editorial and advertising use.`;

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

    let success = false;
    let lastError = '';
    const TEST_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

    for (const model of TEST_MODELS) {
      try {
        const response = await Promise.race([
          ai.models.generateContent({
            model: model,
            contents: 'Ping test. Reply with word OK.',
            config: {
              maxOutputTokens: 5,
              temperature: 0.1,
            },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout with ${model}`)), 5000)
          ),
        ]);

        if (response && response.text) {
          success = true;
          break;
        }
      } catch (err: any) {
        lastError = err?.message || 'Connection failed';
      }
    }

    if (success) {
      res.json({
        success: true,
        message: 'CONNECTED',
      });
    } else {
      res.json({
        success: false,
        message: 'NOT CONNECTED',
        error: lastError || 'Failed to connect to Gemini API',
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
    selectedModel,
  } = req.body;

  const keyToUse = apiKey?.trim() || process.env.GEMINI_API_KEY;

  // If Gemini API Key is available, attempt real AI generation (Multimodal if image provided, Text if text-only)
  if (keyToUse) {
    try {
      const cleanBase64 = imageBase64
        ? imageBase64.replace(/^data:[a-zA-Z0-9\/-]+;base64,/, '').replace(/\s+/g, '')
        : '';
      let cleanMime = (mimeType || 'image/jpeg').toLowerCase();
      if (cleanMime.includes('png')) cleanMime = 'image/png';
      else if (cleanMime.includes('webp')) cleanMime = 'image/webp';
      else cleanMime = 'image/jpeg';

      const ai = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const isVideoAsset = Boolean(filename?.match(/\.(mp4|webm|mov)$/i)) || Boolean(cleanMime?.startsWith('video/'));
      const isVectorAsset = Boolean(filename?.match(/\.(svg|eps|ai)$/i));

      const systemPrompt = `You are an elite, world-class microstock contributor and metadata specialist for ${platform}, Adobe Stock, Shutterstock, Getty Images, and Freepik.
CRITICAL VISION DIRECTIVE:
1. Inspect the ACTUAL VISUAL CONTENT shown in this asset with supreme 100% precision.
2. DO NOT RELY ON OR GUESS FROM THE FILENAME. If the filename is arbitrary, code, or mismatched, base 100% of your output purely on what is physically depicted in the visual artwork or photograph.
3. If this is a coding or tech symbol (e.g. curly brackets, slash, tag, code syntax, tech icon), describe it strictly as programming syntax, web development, coding iconography, and software engineering.
4. If this is an animal, identify the exact species. If a landscape, identify the topography and lighting. If a person, describe their action, lifestyle, and emotion.
5. Title must be 12 to 22 clear, natural words matching the visual scene.
6. Generate 40 to 49 top-ranking, highly relevant microstock tags with zero irrelevant spam.

${
  isVideoAsset
    ? `CRITICAL MEDIA TYPE: THIS IS A VIDEO FOOTAGE ASSET.
- In TITLE & DESCRIPTION: Treat this as commercial video footage. Use terms like "Cinematic Video Footage", "Motion Clip", "Action Sequence", "4K Video Clip".
- NEVER use words like "Photography", "Photo", "Still", or "Picture" in the Title or Description!
- Include video-specific keywords: video, footage, clip, motion, cinematic, 4k, broll, realtime, slow-motion.`
    : isVectorAsset
    ? `CRITICAL MEDIA TYPE: THIS IS A VECTOR GRAPHIC ASSET.
- In TITLE & DESCRIPTION: Treat this as vector artwork. Use terms like "Vector Illustration", "Scalable Vector Graphic", "Design Element", "Clipart".
- NEVER use words like "Photography" or "Photo"!
- Include vector keywords: vector, illustration, graphic, svg, eps, clipart, scalable, editable.`
    : `CRITICAL MEDIA TYPE: THIS IS A COMMERCIAL PHOTOGRAPHY ASSET.`
}

REQUIREMENTS:
1. TITLE:
- Craft an enticing, professional, natural commercial stock title (12 to 22 words) strictly matching what is visible in the artwork.
- NEVER include spam words or irrelevant filler phrases.

2. DESCRIPTION:
- Write 2-3 clean, natural, sales-oriented sentences detailing the actual scene, subject, lighting, and environment for potential stock buyers.

3. KEYWORDS:
- Generate 40 to 49 relevant, top-ranking microstock keywords specifically derived from what is physically visible.
- Include: primary subject name, synonyms, style, usage concepts.
- NEVER include irrelevant categories (do NOT include animals/nature tags for coding/tech icons; do NOT include business/finance tags for animal photos).

4. CATEGORY:
- The single best matching stock category (e.g. Technology, Animals, Nature, Landscapes, People, Food & Drink, Business, Architecture, Design & Graphic Elements).`;

      const hasValidImage = Boolean(cleanBase64 && cleanBase64.length > 100);

      const contents = hasValidImage
        ? [
            {
              inlineData: {
                mimeType: cleanMime,
                data: cleanBase64,
              },
            },
            {
              text: `CRITICAL VISION DIRECTIVE: Inspect this visual image with 100% precision. Look directly at what is depicted in the artwork or photo. Accurately identify the exact subject, visual elements, style, composition, colors, and commercial context. Generate professional microstock JSON metadata (title, description, keywords, category) that strictly and faithfully describes what is visually seen in the image. Do NOT add irrelevant tags or guess from filenames.${customPrompt ? ` Additional instructions: ${customPrompt}` : ''}`,
            },
          ]
        : [
            {
              text: `Analyze this stock asset with filename "${filename}" (${isVectorAsset ? 'Vector Graphic' : isVideoAsset ? 'Video Clip' : 'Commercial Photo'}).${customPrompt ? ` Additional user prompt: ${customPrompt}` : ''} Output high-ranking microstock JSON metadata strictly matching the subject.`,
            },
          ];

      let response: any = null;
      let lastErr: any = null;
      const defaultModels = [
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
      ];
      const CANDIDATE_MODELS = selectedModel
        ? Array.from(new Set([selectedModel, ...defaultModels]))
        : defaultModels;

      for (const modelName of CANDIDATE_MODELS) {
        try {
          response = await Promise.race([
            ai.models.generateContent({
              model: modelName,
              contents: contents,
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
              setTimeout(() => reject(new Error(`Timeout with ${modelName}`)), 22000)
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
      server: { middlewareMode: true, hmr: false, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares as any);
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
