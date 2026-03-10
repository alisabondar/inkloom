import { useState, useEffect } from 'react';
import type { Template } from '@/lib/supabase';

export function usePublicTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/get-public-templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.templates) {
          setTemplates(data.templates);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return { templates, isLoading };
}
