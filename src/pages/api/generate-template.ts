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

    const imagePrompt = `Create a visual reference image for an art template: ${title || 'My Template'}.
    Medium: ${workMedium},
    Difficulty: ${workDifficulty || 'intermediate'},
    Duration: ${workDuration || '2-3 hours'}.
    Vision: ${description}.
    Generate a clear, inspiring reference image that shows the artistic concept, composition, and style that artists can use as guidance for this template.`;

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
