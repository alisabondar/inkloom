import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, title, workMedium, workDifficulty, workDuration } = body;

    let lineDetail = "simple";
    let lineCount = "minimal";
    let complexity = "basic";

    if (workDifficulty === 'beginner') {
      lineDetail = "simple and clean";
      lineCount = "minimal, essential lines only";
      complexity = "basic shapes and forms";
    } else if (workDifficulty === 'intermediate') {
      lineDetail = "moderately detailed";
      lineCount = "moderate number of lines";
      complexity = "intermediate complexity with some details";
    } else if (workDifficulty === 'advanced') {
      lineDetail = "highly detailed";
      lineCount = "many intricate lines";
      complexity = "complex and sophisticated";
    }

    if (workDuration && workDuration.toLowerCase().includes('hour')) {
      lineDetail += " with quick, gestural strokes";
    } else if (workDuration && (workDuration.toLowerCase().includes('day') || workDuration.toLowerCase().includes('week'))) {
      lineDetail += " with careful, precise linework";
      complexity += " and refined details";
    }

    const imagePrompt = `Create a black and white line sketch reference for an art template: ${title || 'My Template'}.
    Medium: ${workMedium},
    Difficulty: ${workDifficulty || 'intermediate'} (${lineDetail}, ${lineCount}),
    Duration: ${workDuration || '2-3 hours'}.
    Vision: ${description}.

    Generate a black and white line drawing sketch using only black lines on white background. The sketch should be ${complexity}. Use ${lineCount} with ${lineDetail} to create a clear, inspiring reference that shows the artistic concept, composition, and style. No shading, no color, no fills - only clean black lines defining the form and structure that artists can use as guidance for this template.`;

    const pixazoKey = process.env.PIXAZO_API_KEY;
    const requestUrl = process.env.PIXAZO_FLUX_SCHNELL_REQUEST_URL || 'https://gateway.pixazo.ai/flux-1-schnell/v1/getData';

    if (!pixazoKey) {
      throw new Error('PIXAZO_API_KEY is not configured. Get a free API key at https://api-console.pixazo.ai/api_keys');
    }

    const pixazoHeaders = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Subscription-Key': pixazoKey,
    };

    const requestResponse = await fetch(requestUrl, {
      method: 'POST',
      headers: pixazoHeaders,
      body: JSON.stringify({
        prompt: imagePrompt,
        num_steps: 4,
        seed: Math.floor(Math.random() * 100000),
        height: 512,
        width: 512,
      }),
    });

    if (!requestResponse.ok) {
      const errorData = await requestResponse.json().catch(() => ({}));
      throw new Error(`Pixazo request failed: ${requestResponse.statusText} - ${JSON.stringify(errorData)}`);
    }

    let requestData = await requestResponse.json();
    const generatedImageId = requestData.request_id || `pixazo-${Date.now()}`;

    if (requestData.status === 'IN_QUEUE' && requestData.request_id) {
      const resultUrl = (process.env.PIXAZO_FLUX_SCHNELL_RESULT_URL || requestUrl.replace('/getData', '/getData-result'));
      const maxAttempts = 30;
      const pollIntervalMs = 2000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        const resultResponse = await fetch(resultUrl, {
          method: 'POST',
          headers: pixazoHeaders,
          body: JSON.stringify({ request_id: requestData.request_id }),
        });
        requestData = await resultResponse.json();

        if (requestData.status === 'COMPLETED' && requestData.images?.length > 0) break;
        if (requestData.status === 'FAILED') {
          throw new Error(requestData.message || 'Pixazo image generation failed');
        }
      }
    }

    let imageBase64: string;
    if (requestData.images && Array.isArray(requestData.images) && requestData.images.length > 0) {
      const img = requestData.images[0];
      const b64 = img.data ?? img.base64;
      if (b64) {
        imageBase64 = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
      } else if (img.url) {
        const imageResponse = await fetch(img.url);
        const imageBuffer = await imageResponse.arrayBuffer();
        if (imageBuffer.byteLength < 1000) {
          throw new Error(`Pixazo image URL returned ${imageBuffer.byteLength} bytes (expected image data).`);
        }
        imageBase64 = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
      } else {
        throw new Error(`Unexpected Pixazo image format: ${JSON.stringify(img)}`);
      }
    } else if (requestData.output || requestData.image) {
      const out = requestData.output || requestData.image;
      if (typeof out === 'string' && out.startsWith('http')) {
        const imageResponse = await fetch(out);
        const imageBuffer = await imageResponse.arrayBuffer();
        if (imageBuffer.byteLength < 1000) {
          throw new Error(`Pixazo output URL returned ${imageBuffer.byteLength} bytes (expected image data).`);
        }
        imageBase64 = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
      } else {
        imageBase64 = out.startsWith('data:') ? out : `data:image/png;base64,${out}`;
      }
    } else {
      throw new Error(`Pixazo returned no image. Response: ${JSON.stringify(requestData).slice(0, 200)}`);
    }

    if (!supabaseAdmin) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local for storage uploads.');
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (!buffer?.length || buffer.length < 100) {
      throw new Error('Invalid or empty image data from Pixazo');
    }

    const filename = `template-${Date.now()}-${generatedImageId.replace(/[/\\]/g, '-')}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('templates')
      .upload(filename, buffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      throw new Error('Failed to upload image to storage');
    }

    return NextResponse.json({
      success: true,
      image: imageBase64,
      image_url: filename,
      prompt: imagePrompt,
      title: title,
      medium: workMedium,
      difficulty: workDifficulty,
      duration: workDuration,
      generated_image_id: generatedImageId,
      source: "DESCRIPTION",
      provider: "pixazo-flux-schnell"
    });

  } catch (error) {
    console.error('Pixazo Error:', error);
    return NextResponse.json({
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

