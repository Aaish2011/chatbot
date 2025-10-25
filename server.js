// server.js
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Get current directory (for ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend
app.use(express.static(path.join(__dirname, "frontend")));

const PORT = process.env.PORT || 4000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Log API key status
console.log(GROQ_API_KEY ? "✅ GROQ_API_KEY Loaded" : "❌ Missing GROQ_API_KEY in .env");

// 🧠 Local fallback knowledge base
const knowledgeBase = [
  { q: "what is diwali", a: "Diwali is the festival of lights celebrated across India." },
  { q: "what is holi", a: "Holi is the festival of colors, marking the arrival of spring." },
];

// 🟢 Chat route
app.post("/chat", async (req, res) => {
  console.log("📩 /chat called. Body:", req.body);
  const { userMessage } = req.body;

  if (!userMessage) {
    console.log("⚠️ No message provided");
    return res.status(400).json({ botReply: "Please enter a message." });
  }

  // 1️⃣ Check local base
  const local = knowledgeBase.find(item =>
    userMessage.toLowerCase().includes(item.q)
  );
  if (local) {
    console.log("💬 Replied from local base");
    return res.json({ botReply: local.a });
  }

  // 2️⃣ Call GROQ API
  try {
    console.log("🚀 Sending message to GROQ...");
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are LIMUS.AI, an expert on Indian culture." },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await response.json();
    console.log("🧾 Groq API Response:", JSON.stringify(data, null, 2));

    const botReply = data?.choices?.[0]?.message?.content || "Sorry, no reply.";
    res.json({ botReply });
  } catch (err) {
    console.error("❌ Error talking to Groq:", err);
    res.status(500).json({ botReply: "Error connecting to AI model." });
  }
});

// Serve frontend for any route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
