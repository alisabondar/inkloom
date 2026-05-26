import { useState, useEffect } from 'react';
import type { Template } from '@/lib/supabase';

export function usePublicTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/get-public-templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.templates) {
          setTemplates(data.templates);
          setError(null);
        } else {
          setError(data.error || 'Unable to load shared templates right now.');
        }
      })
      .catch(() => setError('Unable to load shared templates right now.'))
      .finally(() => setIsLoading(false));
  }, []);

  return { templates, isLoading, error };
}
