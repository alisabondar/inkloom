import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const response = await openai.responses.create({
      model: "gpt-5",
      input: imagePrompt,
      tools: [{ type: "image_generation" }],
    });

    const imageData = response.output
      .filter((output) => output.type === "image_generation_call")
      .map((output) => output.result);

    if (imageData.length === 0) {
      throw new Error('No image generated');
    }

    const imageBase64 = imageData[0];

    const base64Data = imageBase64?.replace(/^data:image\/\w+;base64,/, '');
    const buffer = base64Data && Buffer.from(base64Data, 'base64');

    const filename = `template-${Date.now()}-${response.id}.png`;

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
      generated_image_id: response.id,
      source: "DESCRIPTION"
    });

  } catch (error) {
    console.error('DALL-E API Error:', error);
    return NextResponse.json({
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

