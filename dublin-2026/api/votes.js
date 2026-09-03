import { neon } from '@neondatabase/serverless';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

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
  await sql`CREATE INDEX IF NOT EXISTS trip_votes_city_idx ON trip_votes(city)`;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ ok:false, error:'DATABASE_URL manquante dans Vercel' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await ensureSchema(sql);

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT participant, city, category, choice_id, vote, updated_at
        FROM trip_votes
        ORDER BY lower(participant), city, category, choice_id
      `;
      return res.status(200).json({ ok:true, votes:rows });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const participant = String(body.participant || '').trim().slice(0,80);
      const city = String(body.city || '').trim().toLowerCase().slice(0,40);
      const category = String(body.category || '').trim().toLowerCase().slice(0,40);
      const choiceId = String(body.choiceId || '').trim().slice(0,120);
      const vote = String(body.vote || '').trim().toLowerCase();

      if (!participant || !city || !category || !choiceId || !['oui','bof','non'].includes(vote)) {
        return res.status(400).json({ ok:false, error:'Vote incomplet ou invalide' });
      }

      await sql`
        INSERT INTO trip_votes (participant, city, category, choice_id, vote, updated_at)
        VALUES (${participant}, ${city}, ${category}, ${choiceId}, ${vote}, NOW())
        ON CONFLICT (participant, city, category, choice_id)
        DO UPDATE SET vote = EXCLUDED.vote, updated_at = NOW()
      `;
      return res.status(200).json({ ok:true });
    }

    return res.status(405).json({ ok:false, error:'Méthode non autorisée' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok:false, error:'Erreur base de données' });
  }
}
