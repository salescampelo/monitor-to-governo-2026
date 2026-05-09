import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ALLOWED_FILES = new Set([
  'adversarios.json',
  'adversarios_mentions.json',
  'social_metrics.json',
  'vetores_processuais.json',
]);

export default async function handler(req, res) {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = auth.slice(7);
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { file } = req.query;
  if (!file || !ALLOWED_FILES.has(file)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  try {
    const content = readFileSync(join(__dirname, '..', '..', 'public', 'data', file), 'utf-8');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.status(200).send(content);
  } catch {
    res.status(500).json({ error: 'Internal error' });
  }
}
