import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://my-study-ai-app.github.io';
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '30kb' }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === FRONTEND_ORIGIN || origin === 'https://my-study-ai-app.github.io') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 25, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ ok: true, aiConfigured: Boolean(client) }));

app.post('/api/chat', async (req, res) => {
  if (!client) return res.status(503).json({ error: 'O servidor ainda não tem a chave da API configurada.' });
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const clean = messages
    .filter(m => ['user', 'assistant'].includes(m?.role) && typeof m?.content === 'string')
    .slice(-24)
    .map(m => ({ role: m.role, content: m.content.slice(0, 6000) }));
  if (!clean.length || !clean.some(m => m.role === 'user')) return res.status(400).json({ error: 'Envia uma pergunta para começar.' });
  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      instructions: 'És o Professor IA do Study AI, um tutor simpático para alunos. Responde sempre em português europeu (Portugal), com linguagem clara e adequada à idade escolar. Explica por etapas, mostra cálculos quando necessário, dá exemplos e incentiva o aluno a pensar. Não inventes factos; admite quando não sabes. Se a pergunta envolver perigo, saúde ou decisões importantes, aconselha a falar com um adulto de confiança ou profissional adequado. O aluno pode estar no 8.º ano. Não afirmes ser humano.',
      input: clean
    });
    const reply = response.output_text?.trim();
    if (!reply) return res.status(502).json({ error: 'A IA não devolveu texto nesta tentativa.' });
    res.json({ reply });
  } catch (err) {
    console.error('Erro na API de chat:', err?.status || err?.message || 'erro desconhecido');
    res.status(502).json({ error: 'Não foi possível obter uma resposta da IA agora. Tenta novamente.' });
  }
});

app.post('/api/speech', async (req, res) => {
  if (!client) return res.status(503).json({ error: 'O servidor ainda não tem a chave da API configurada.' });
  const text = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, 3500) : '';
  if (!text) return res.status(400).json({ error: 'Não há texto para ler.' });
  try {
    const audio = await client.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
      voice: process.env.OPENAI_TTS_VOICE || 'ash',
      input: text,
      instructions: 'Fala em português europeu de Portugal, com voz masculina jovem, natural, clara, simpática e tranquilizadora. Usa pronúncia de Portugal, ritmo moderado e entoação natural. Evita soar robótico ou excessivamente dramático.'
    });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(Buffer.from(await audio.arrayBuffer()));
  } catch (err) {
    console.error('Erro na API de voz:', err?.status || err?.message || 'erro desconhecido');
    res.status(502).json({ error: 'Não foi possível gerar a voz agora. Tenta novamente.' });
  }
});

app.get('/', (_req, res) => res.type('text/plain').send('Study AI Professor API is running.'));
app.listen(PORT, () => console.log(`Study AI Professor API a ouvir na porta ${PORT}`));
