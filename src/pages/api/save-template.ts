import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, Template, TemplateInsert } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, medium, difficulty, duration, generated_image_id, image_url, source } = req.body;

    // use hardcoded user_id for now
    const user_id = "1";

    const newTemplate: TemplateInsert = {
      title: title || 'Untitled Template',
      medium,
      difficulty,
      duration,
      generated_image_id,
      image_url,
      source,
      user_id
    };

    const { data, error } = await supabase
      .from('template')
      .insert([newTemplate])
      .select()
      .single<Template>();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save template to database' });
    }

    res.status(201).json({
      success: true,
      template: data
    });

  } catch (error) {
    console.error('Save template error:', error);
    res.status(500).json({
      error: 'Failed to save template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
