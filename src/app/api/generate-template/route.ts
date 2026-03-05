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

    // deAPI integration
    const deApiKey = process.env.DEAPI_API_KEY;
    const deApiUrl = process.env.DEAPI_URL || 'https://api.deapi.com/v1/images/generate';

    if (!deApiKey) {
      throw new Error('DEAPI_API_KEY is not configured');
    }

    // Make request to deAPI
    const deApiResponse = await fetch(deApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deApiKey}`,
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        // Adjust these parameters based on deAPI's actual API requirements
        model: process.env.DEAPI_MODEL || 'default',
        size: process.env.DEAPI_IMAGE_SIZE || '1024x1024',
        quality: 'standard',
        response_format: 'b64_json', // or 'url' depending on deAPI's options
      }),
    });

    if (!deApiResponse.ok) {
      const errorData = await deApiResponse.json().catch(() => ({}));
      throw new Error(`deAPI request failed: ${deApiResponse.statusText} - ${JSON.stringify(errorData)}`);
    }

    const deApiData = await deApiResponse.json();

    // Handle different response formats from deAPI
    // Adjust this based on deAPI's actual response structure
    let imageBase64: string;
    let generatedImageId: string;

    if (deApiData.data && Array.isArray(deApiData.data) && deApiData.data.length > 0) {
      // If response has data array (similar to OpenAI format)
      const imageItem = deApiData.data[0];
      imageBase64 = imageItem.b64_json || imageItem.url || imageItem.image;
      generatedImageId = imageItem.id || deApiData.id || `deapi-${Date.now()}`;
    } else if (deApiData.image) {
      // If response has direct image field
      imageBase64 = deApiData.image;
      generatedImageId = deApiData.id || `deapi-${Date.now()}`;
    } else if (deApiData.b64_json) {
      // If response has b64_json at root
      imageBase64 = deApiData.b64_json;
      generatedImageId = deApiData.id || `deapi-${Date.now()}`;
    } else if (deApiData.url) {
      // If response is a URL, fetch and convert to base64
      const imageResponse = await fetch(deApiData.url);
      const imageBuffer = await imageResponse.arrayBuffer();
      imageBase64 = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
      generatedImageId = deApiData.id || `deapi-${Date.now()}`;
    } else {
      throw new Error('Unexpected response format from deAPI');
    }

    // Ensure base64 format includes data URI prefix if not already present
    if (imageBase64 && !imageBase64.startsWith('data:')) {
      imageBase64 = `data:image/png;base64,${imageBase64}`;
    }

    const base64Data = imageBase64?.replace(/^data:image\/\w+;base64,/, '');
    const buffer = base64Data && Buffer.from(base64Data, 'base64');

    const filename = `template-${Date.now()}-${generatedImageId}.png`;

    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('templates')
      .upload(filename, buffer || '', {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      throw new Error('Failed to upload image to storage');
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('templates')
      .getPublicUrl(filename);

    const imageUrl = urlData.publicUrl;

    return NextResponse.json({
      success: true,
      image: imageBase64,
      image_url: imageUrl,
      prompt: imagePrompt,
      title: title,
      medium: workMedium,
      difficulty: workDifficulty,
      duration: workDuration,
      generated_image_id: generatedImageId,
      source: "DESCRIPTION"
    });

  } catch (error) {
    console.error('deAPI Error:', error);
    return NextResponse.json({
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

