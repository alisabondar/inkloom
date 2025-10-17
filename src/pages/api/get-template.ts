import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, Template } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    const { data, error } = await supabase
      .from('template')
      .select('*')
      .eq('id', id)
      .single<Template>();

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Template not found' });
      }
      return res.status(500).json({ error: 'Failed to retrieve template from database' });
    }

    res.status(200).json({
      success: true,
      template: data
    });

  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      error: 'Failed to retrieve template',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
