import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, medium, difficulty, duration, generated_image_id, image_url, source } = req.body;

    if (!generated_image_id || !source || !image_url) {
      return res.status(400).json({ error: 'Missing required fields: generated_image_id, image_url, and source are required' });
    }

    // use hardcoded user_id for now
    const user_id = "1";

    const { data, error } = await supabase
      .from('template')
      .insert([
        {
          title: title || 'Untitled Template',
          medium: medium || '',
          difficulty: difficulty || '',
          duration: duration || '',
          generated_image_id,
          image_url,
          source,
          user_id
        }
      ])
      .select()
      .single();

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
