import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { description, title, workMedium, workDifficulty, workDuration } = req.body;

    // to add a toast
    if (!description) {
      return res.status(400).json({ error: 'Vision description is required' });
    }

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

    // Extract the generated image data
    const imageData = response.output
      .filter((output) => output.type === "image_generation_call")
      .map((output) => output.result);

    if (imageData.length === 0) {
      throw new Error('No image generated');
    }

    const imageBase64 = imageData[0];

    res.status(200).json({
      success: true,
      image: imageBase64,
      prompt: imagePrompt
    });

  } catch (error) {
    console.error('DALL-E API Error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
