import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, Template, SupabaseQueryResponse } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { limit = '10', offset = '0' } = req.query;

   // use hardcoded user_id for now
    const user_id = "1";

    const { data: templates, error, count } = (await supabase
      .from('template')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string))
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1)) as SupabaseQueryResponse<Template[]>;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to retrieve templates from database' });
    }

    res.status(200).json({
      success: true,
      templates,
      count: count || 0,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      error: 'Failed to retrieve templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
