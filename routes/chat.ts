import express from "express";
import { GoogleGenAI } from "@google/genai";
import { QdrantClient } from "@qdrant/js-client-rest";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Initialize clients
if (!process.env.GEMINI_API_KEY || !process.env.QDRANT_API_KEY || !process.env.QDRANT_URL) {
  throw new Error("Missing environment variables");
}

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const qdrant = new QdrantClient({
  apiKey: process.env.QDRANT_API_KEY,
  url: process.env.QDRANT_URL,
});

// 🧩 Function to embed and upload a file to Qdrant
async function embedAndUploadToQdrant() {
  const collectionName = "portfolio";

  // 1️⃣ Check or create collection
  try {
    await qdrant.getCollection(collectionName);
  } catch {
    await qdrant.createCollection(collectionName, {
      vectors: { size: 3072, distance: "Cosine" },
    });
  }

  // 2️⃣ Read your local text file
  const text = fs.readFileSync("./data/notes.txt", "utf8");

  // 3️⃣ Generate embedding
  const result = await genAI.models.embedContent({
    model: "gemini-embedding-001", // or "text-embedding-004"
    contents: text,
  });

  // ✅ Correct property path
  const embedding = result.embeddings?.[0];
  if (!embedding) throw new Error("Failed to generate embedding.");

  const vector = embedding.values;

  // 4️⃣ Upload embedding + text to Qdrant
  if (!vector) throw new Error("Failed to get vector from embedding.");

  await qdrant.upsert(collectionName, {
    points: [
      {
        id: 1,
        vector,
        payload: { text },
      },
    ],
  });

  console.log("✅ Text embedded and uploaded to Qdrant");
}
embedAndUploadToQdrant();

// 💬 API route for querying
router.post("/", async (req, res) => {
  const { message } = req.body;

  try {
    // 1️⃣ Embed user query
    const queryResult = await genAI.models.embedContent({
      model: "gemini-embedding-001",
      contents: message,
    });

    const queryEmbedding = queryResult.embeddings?.[0];
    if (!queryEmbedding) throw new Error("Failed to generate query embedding.");

    const queryVector = queryEmbedding.values;

    // 2️⃣ Search Qdrant
    if (!queryVector) throw new Error("Failed to get vector from query embedding.");

    const search = await qdrant.search("portfolio", {
      vector: queryVector,
      limit: 3,
    });

    const context = search.map((r: any) => r.payload.text).join("\n\n");

    // 3️⃣ Start chat (new API)
    const chat = genAI.chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction:
          "You are a helpful assistant representing Carlos Quihuis. Your name is Carlos. Respond to questions in a conversational and friendly tone, as if you were Carlos himself. Keep your answers concise and natural, like you're having a chat. Use the provided context to answer questions, but don't just repeat it. If you don't know the answer, say so in a friendly way.",
      },
    });

    const response = await chat.sendMessage({
      message: `Context:\n${context}\n\nUser: ${message}`,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
