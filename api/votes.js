import { neon } from '@neondatabase/serverless';

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS trip_votes (
      id BIGSERIAL PRIMARY KEY,
      participant TEXT NOT NULL,
      city TEXT NOT NULL,
      category TEXT NOT NULL,
      choice_id TEXT NOT NULL,
      vote TEXT NOT NULL CHECK (vote IN ('oui','bof','non')),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(participant, city, category, choice_id)
    )
  `;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!process.env.DATABASE_URL) return res.status(503).json({ok:false,error:'DATABASE_URL manquante'});
  try {
    const sql = neon(process.env.DATABASE_URL);
    await ensureSchema(sql);
    if (req.method === 'GET') {
      const rows = await sql`SELECT participant, city, category, choice_id, vote, updated_at FROM trip_votes ORDER BY lower(participant), city, category, choice_id`;
      return res.status(200).json({ok:true,votes:rows});
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const participant = String(b.participant || '').trim().slice(0,80);
      const city = String(b.city || '').trim().toLowerCase().slice(0,40);
      const category = String(b.category || '').trim().toLowerCase().slice(0,40);
      const choiceId = String(b.choiceId || '').trim().slice(0,120);
      const vote = String(b.vote || '').trim().toLowerCase();
      if (!participant || !city || !category || !choiceId || !['oui','bof','non'].includes(vote)) return res.status(400).json({ok:false,error:'Vote invalide'});
      await sql`INSERT INTO trip_votes (participant, city, category, choice_id, vote, updated_at) VALUES (${participant},${city},${category},${choiceId},${vote},NOW()) ON CONFLICT (participant, city, category, choice_id) DO UPDATE SET vote=EXCLUDED.vote, updated_at=NOW()`;
      return res.status(200).json({ok:true});
    }
    return res.status(405).json({ok:false,error:'Méthode non autorisée'});
  } catch (e) {
    console.error(e);
    return res.status(500).json({ok:false,error:'Erreur base de données'});
  }
}
