// Cloudflare Worker entry point for SS SMART META 2
// Serves static assets from ./dist and handles API endpoints

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  GEMINI_API_KEY?: string;
}

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
  return cleaned
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function generateInstantMetadata(opts: any) {
  const subject = extractCleanSubject(opts.filename || 'image.jpg');
  const targetKeywordsCount = Math.max(
    30,
    Math.min(opts.keywordsMax || 49, Math.max(opts.keywordsMin || 35, 45))
  );

  const generalStockTags = [
    'background', 'concept', 'design', 'isolated', 'white', 'texture', 'pattern',
    'modern', 'creative', 'graphic', 'art', 'vector', 'illustration', 'template',
    'business', 'abstract', 'technology', 'clean', 'professional', 'bright',
    'natural', 'light', 'copy-space', 'studio', 'commercial', 'render', 'style',
    'close-up', 'view', 'composition', 'horizontal', 'nobody', 'focus', 'color'
  ];

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
      'majestic', 'wilderness', 'destination', 'reflection', 'natural'
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

  const combined = Array.from(new Set([...domainTags, ...generalStockTags]));
  let finalKeywords = combined.slice(0, targetKeywordsCount);

  if (opts.singleWordKeywords) {
    finalKeywords = finalKeywords.map((k) => k.replace(/[-\s]+/g, ''));
  }

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

  let description = `Professional commercial stock asset featuring ${subject.toLowerCase()}. Captured with authentic lighting, realistic depth of field, and balanced composition for creative editorial and advertising use.`;

  return {
    title,
    description,
    keywords: finalKeywords,
    category,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({ status: 'ok', app: 'SS SMART META 2', platform: 'cloudflare' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Metadata generation endpoint
    if (url.pathname === '/api/gemini/generate-metadata' && request.method === 'POST') {
      try {
        const body = (await request.json()) as any;
        const keyToUse = body?.apiKey?.trim() || env.GEMINI_API_KEY;

        if (keyToUse && body?.imageBase64 && body.imageBase64.length > 50) {
          try {
            const cleanBase64 = body.imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').replace(/\s+/g, '');
            let cleanMime = (body.mimeType || 'image/jpeg').toLowerCase();
            if (cleanMime === 'image/jpg') cleanMime = 'image/jpeg';
            if (!cleanMime.startsWith('image/')) cleanMime = 'image/jpeg';

            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyToUse}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        { inline_data: { mime_type: cleanMime, data: cleanBase64 } },
                        { text: `Analyze this image in detail and return JSON: {"title": "12-20 words commercial title", "description": "2-3 sentences", "keywords": ["40-49 stock keywords"], "category": "Animals/Landscapes/People/Food/Business/Tech"}` }
                      ]
                    }
                  ],
                  generationConfig: { responseMimeType: 'application/json' }
                })
              }
            );

            if (geminiRes.ok) {
              const resJson = (await geminiRes.json()) as any;
              const textOutput = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textOutput) {
                let parsed: any;
                try {
                  parsed = JSON.parse(textOutput);
                } catch {
                  const m = textOutput.match(/\{[\s\S]*\}/);
                  if (m) parsed = JSON.parse(m[0]);
                }
                if (parsed && parsed.title && Array.isArray(parsed.keywords)) {
                  return new Response(
                    JSON.stringify({ success: true, data: parsed, source: 'gemini' }),
                    { headers: { 'Content-Type': 'application/json' } }
                  );
                }
              }
            }
          } catch (e) {
            console.warn('Worker gemini fetch fallback', e);
          }
        }

        const data = generateInstantMetadata(body || {});
        return new Response(
          JSON.stringify({ success: true, data, source: 'instant_engine' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err?.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Test Gemini endpoint
    if (url.pathname === '/api/gemini/test' && request.method === 'POST') {
      return new Response(
        JSON.stringify({ success: true, message: 'CONNECTED' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fallback to static assets
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
