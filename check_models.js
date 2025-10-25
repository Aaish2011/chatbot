require('dotenv').config();
const fetch = require('node-fetch');

async function listModels() {
  const res = await fetch(`${process.env.GROQ_API_BASE}/models`, {
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
  });
  const j = await res.json();
  console.log(JSON.stringify(j, null, 2));
}
listModels().catch(e => console.error('Error', e));
