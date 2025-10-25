// ingest.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const Database = require('better-sqlite3');

const DB = new Database(path.join(__dirname, 'kb.sqlite3'));
DB.exec(`
CREATE TABLE IF NOT EXISTS chunks (
  id INTEGER PRIMARY KEY,
  source TEXT,
  text TEXT,
  embedding BLOB
);
`);

// Convert float array -> Buffer (little-endian float32)
function floatsToBuffer(arr) {
  const buf = Buffer.alloc(arr.length * 4);
  for (let i = 0; i < arr.length; i++) buf.writeFloatLE(arr[i], i*4);
  return buf;
}

async function embedText(text) {
  // If your Groq account exposes an embeddings endpoint, call it here.
  // POST ${GROQ_API_BASE}/embeddings  (OpenAI-compatible)
  const url = `${process.env.GROQ_API_BASE}/embeddings`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.EMBED_MODEL,
      input: text
    })
  });
  if (!resp.ok) {
    const textErr = await resp.text();
    throw new Error(`Embedding call failed: ${resp.status} ${textErr}`);
  }
  const j = await resp.json();
  // j.data[0].embedding is expected (OpenAI-compatible)
  return j.data[0].embedding;
}

(async function ingest() {
  const files = fs.readdirSync(path.join(__dirname, '..', 'knowledge'))
                   .filter(f => f.endsWith('.md') || f.endsWith('.txt'));
  const insert = DB.prepare('INSERT INTO chunks (source, text, embedding) VALUES (?, ?, ?)');
  for (const file of files) {
    const content = fs.readFileSync(path.join(__dirname, '..', 'knowledge', file), 'utf8');
    // simple chunker ~800 chars (tune as needed)
    const chunks = content.match(/[\s\S]{1,800}/g) || [];
    for (const chunk of chunks) {
      console.log('Embedding chunk from', file);
      const emb = await embedText(chunk);
      insert.run(file, chunk, floatsToBuffer(emb));
      // small delay to be polite
      await new Promise(r => setTimeout(r, 100));
    }
  }
  console.log('Ingest complete.');
})();
